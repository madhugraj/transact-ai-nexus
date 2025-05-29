
import { fileToBase64, processImageWithGemini } from "@/services/api/geminiService";

const DOCUMENT_CLASSIFICATION_PROMPT = `You are an expert AI assistant that processes business documents. Your responsibilities include:

### 🎯 OBJECTIVES:
1. **Classify** the input document into one of the below predefined types and subtypes.
2. **Extract key content** into a structured **JSON format**, using the appropriate schema that fits the classified document type.

### 📚 DOCUMENT TYPES & SUBTYPES:
1. **Procurement & Finance**
   - Purchase Order (PO)
   - Invoice
   - Payment Advice

2. **Insurance & Claims**
   - Claim Form
   - Accident Report

3. **Banking & Loan Origination**
   - Loan Application
   - Property Appraisal

4. **Legal & Compliance**
   - Contract
   - Company Filings

5. **HR & Onboarding**
   - Offer Letter
   - Resume
   - Job Description

6. **Healthcare**
   - Prescription
   - Treatment Summary

7. **Trade & Export/Import**
   - Letter of Credit
   - Customs Declarations

8. **Education & Certification**
   - Student Application
   - Certificates

Return ONLY a valid JSON object with the classification and extracted data. Do not include any additional text or markdown formatting.`;

export const parseGeminiResponse = (responseText: string): any => {
  console.log("🔍 Parsing document classification response...");
  
  try {
    const parsed = JSON.parse(responseText.trim());
    console.log("✅ Direct JSON parsing successful");
    return parsed;
  } catch (error) {
    console.log("❌ Direct JSON parsing failed, trying code block extraction...");
  }
  
  const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const codeBlockMatch = responseText.match(codeBlockRegex);
  
  if (codeBlockMatch) {
    try {
      const extractedJson = JSON.parse(codeBlockMatch[1].trim());
      console.log("✅ Successfully extracted JSON from code block");
      return extractedJson;
    } catch (error) {
      console.error("❌ Failed to parse JSON from code block:", error);
    }
  }
  
  const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
  const jsonMatch = responseText.match(jsonRegex);
  
  if (jsonMatch) {
    try {
      const extractedJson = JSON.parse(jsonMatch[0]);
      console.log("✅ Successfully extracted JSON using regex");
      return extractedJson;
    } catch (error) {
      console.error("❌ Failed to parse extracted JSON:", error);
    }
  }
  
  console.error("❌ All parsing methods failed");
  throw new Error(`Unable to extract valid JSON from response`);
};

export const classifyDocument = async (file: File): Promise<any> => {
  const base64Image = await fileToBase64(file);
  console.log("📄 File converted to base64, length:", base64Image.length);
  
  const response = await processImageWithGemini(
    DOCUMENT_CLASSIFICATION_PROMPT,
    base64Image,
    file.type
  );

  if (!response.success || !response.data) {
    console.error("❌ Gemini processing failed:", response.error);
    throw new Error(response.error || "Failed to process document");
  }

  console.log("✅ Gemini response received, parsing...");
  const extractedData = parseGeminiResponse(response.data);
  console.log("✅ Data extracted:", extractedData);
  
  return extractedData;
};
