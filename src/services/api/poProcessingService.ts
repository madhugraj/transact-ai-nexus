
export interface POData {
  po_number: string;
  vendor: string;
  date: string;
  total_amount: string;
  items: Array<{
    description: string;
    quantity: string;
    unit_price: string;
    total: string;
  }>;
  shipping_address?: string;
  billing_address?: string;
}

export interface POProcessingResult {
  success: boolean;
  data?: POData;
  error?: string;
  supabaseData?: any; // Formatted for po_table
}

export const extractPODataFromFile = async (file: File): Promise<POProcessingResult> => {
  try {
    const GEMINI_API_KEY = 'AIzaSyDkF4Gb6kCEI6aNR4SzW-wgGbEE6xGQSr0';
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🤖 Processing file with Gemini:', file.name);

    // Convert file to base64
    const fileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const prompt = `
      Extract Purchase Order (PO) data from this document. Return ONLY valid JSON in this exact format:
      {
        "po_number": "PO number as string",
        "po_date": "YYYY-MM-DD format or null",
        "vendor_code": "Vendor/supplier name",
        "project": "Project name or reference",
        "gstn": "GST/Tax number if found",
        "bill_to_address": "Complete billing address",
        "ship_to": "Complete shipping address", 
        "del_start_date": "Delivery start date YYYY-MM-DD or null",
        "del_end_date": "Delivery end date YYYY-MM-DD or null",
        "terms_conditions": "Payment terms and conditions",
        "description": [
          {
            "item": "Item description",
            "quantity": 1,
            "unit_price": 100.00,
            "total": 100.00
          }
        ]
      }
      
      Important instructions:
      - Extract PO number from any document identifier
      - Convert dates to YYYY-MM-DD format
      - For items array, ensure quantity, unit_price, and total are numbers
      - If no data found for a field, use null or empty string
      - Return ONLY the JSON object, no additional text
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.type,
                  data: fileBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Full Gemini API response:', data);
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    console.log('Raw Gemini response:', generatedText);

    // Clean the response and parse JSON
    let cleanedResponse = generatedText.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    try {
      const poData = JSON.parse(cleanedResponse);
      console.log('✅ Successfully extracted PO data:', poData);
      
      // Validate that we have some meaningful data
      if (!poData.po_number && !poData.vendor_code && !poData.description) {
        console.warn('⚠️ No meaningful PO data found, but continuing...');
      }

      // Format data for Supabase po_table
      const supabaseData = {
        po_number: parseInt(poData.po_number?.replace(/\D/g, '') || '0') || null,
        po_date: poData.po_date || null,
        vendor_code: poData.vendor_code || null,
        project: poData.project || null,
        gstn: poData.gstn || null,
        bill_to_address: poData.bill_to_address || null,
        ship_to: poData.ship_to || null,
        del_start_date: poData.del_start_date || null,
        del_end_date: poData.del_end_date || null,
        terms_conditions: poData.terms_conditions || null,
        description: poData.description || [],
        file_name: file.name
      };

      console.log('📊 Formatted data for Supabase:', supabaseData);
      
      return {
        success: true,
        data: {
          po_number: poData.po_number || 'N/A',
          vendor: poData.vendor_code || 'N/A',
          date: poData.po_date || 'N/A',
          total_amount: 'N/A', // Will be calculated from items
          items: (poData.description || []).map((item: any) => ({
            description: item.item || 'N/A',
            quantity: item.quantity?.toString() || '0',
            unit_price: item.unit_price?.toString() || '0',
            total: item.total?.toString() || '0'
          })),
          shipping_address: poData.ship_to,
          billing_address: poData.bill_to_address
        },
        supabaseData
      };
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('❌ Cleaned response was:', cleanedResponse);
      return {
        success: false,
        error: `Failed to parse response: ${parseError.message}. Response: ${cleanedResponse.substring(0, 200)}...`
      };
    }

  } catch (error) {
    console.error('❌ Error processing PO file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
