
import { ApiResponse } from './types';
import { supabase } from '@/integrations/supabase/client';
import { processImageWithGemini } from './gemini/visionService';
import { fileToBase64 } from './gemini/fileUtils';

export type DocumentClassification = 'invoice' | 'purchase_order' | 'bill' | 'receipt' | 'email' | 'report' | 'other';

export interface ClassificationResult {
  classification: DocumentClassification;
  confidence: number;
  metadata?: Record<string, any>;
}

const DEFAULT_CLASSIFICATION_PROMPT = `
Analyze this document and classify it into one of these categories:
- invoice
- purchase_order
- bill
- receipt
- email
- report
- other

Return ONLY a JSON object with this exact structure:
{
  "classification": "one_of_above_categories",
  "confidence": 0.X,
  "metadata": {
    "detected_date": "YYYY-MM-DD",
    "detected_amount": "X.XX",
    "detected_entity": "Entity Name if Present",
    "detected_id": "Document ID/Number if Present"
  }
}
`;

/**
 * Classify a file using AI
 */
export const classifyFileWithAI = async (
  file: File
): Promise<ApiResponse<ClassificationResult>> => {
  console.log(`Classifying file: ${file.name}, type: ${file.type}`);
  
  try {
    // Only process PDFs and images
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      // For non-image/PDF files, classify based on extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        return {
          success: true,
          data: {
            classification: 'report',
            confidence: 0.9
          }
        };
      }
      
      if (extension === 'eml' || extension === 'msg') {
        return {
          success: true,
          data: {
            classification: 'email',
            confidence: 0.95
          }
        };
      }
      
      return {
        success: true,
        data: {
          classification: 'other',
          confidence: 0.5
        }
      };
    }
    
    // Convert file to base64 for Gemini processing
    const base64Image = await fileToBase64(file);
    
    // Use Gemini Vision to classify document
    const response = await processImageWithGemini(
      DEFAULT_CLASSIFICATION_PROMPT, 
      base64Image, 
      file.type
    );
    
    if (!response.success) {
      return {
        success: false,
        error: response.error
      };
    }
    
    // Parse the response to extract classification
    try {
      // Try to extract JSON
      const jsonMatch = response.data.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No valid JSON found in response");
        return {
          success: false,
          error: "Failed to extract classification from response"
        };
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      if (!result.classification) {
        return {
          success: false,
          error: "Invalid classification result"
        };
      }
      
      return {
        success: true,
        data: {
          classification: result.classification as DocumentClassification,
          confidence: result.confidence || 0.7,
          metadata: result.metadata || {}
        }
      };
    } catch (parseError) {
      console.error("Error parsing classification JSON:", parseError);
      
      // Fallback classification based on file type
      if (file.type === 'application/pdf') {
        return {
          success: true,
          data: {
            classification: 'report',
            confidence: 0.6
          }
        };
      } else if (file.type.startsWith('image/')) {
        return {
          success: true,
          data: {
            classification: 'receipt',
            confidence: 0.6
          }
        };
      }
      
      return {
        success: false,
        error: "Failed to parse classification result"
      };
    }
  } catch (error) {
    console.error("Error classifying file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Save file classification to database
 */
export const saveFileClassification = async (
  fileId: string,
  classification: ClassificationResult
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('uploaded_files')
      .update({
        document_type: classification.classification,
        classification_confidence: classification.confidence,
        metadata: classification.metadata
      })
      .eq('id', fileId);
    
    if (error) {
      console.error("Error saving classification:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error("Error saving classification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
