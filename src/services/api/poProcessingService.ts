
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
        "po_number": "PO number",
        "vendor": "Vendor name",
        "date": "PO date",
        "total_amount": "Total amount",
        "items": [
          {
            "description": "Item description",
            "quantity": "Quantity",
            "unit_price": "Unit price",
            "total": "Line total"
          }
        ],
        "shipping_address": "Shipping address",
        "billing_address": "Billing address"
      }
      
      Important: Return ONLY the JSON object, no additional text or formatting.
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
      
      // Validate that we have the expected structure
      if (!poData.po_number && !poData.vendor && !poData.items) {
        throw new Error('Response does not contain expected PO data structure');
      }
      
      return {
        success: true,
        data: poData
      };
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('❌ Cleaned response was:', cleanedResponse);
      return {
        success: false,
        error: `Failed to parse response: ${parseError.message}`
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
