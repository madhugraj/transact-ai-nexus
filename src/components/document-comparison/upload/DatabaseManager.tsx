
import { supabase } from "@/integrations/supabase/client";

export class DatabaseManager {
  async checkSourceDocumentExists(fileName: string): Promise<{ exists: boolean; id?: number; data?: any }> {
    try {
      console.log("🔍 Checking if source document exists:", fileName);
      
      const { data: exactMatch, error } = await supabase
        .from('compare_source_document')
        .select('id, doc_json_extract, doc_type')
        .eq('doc_title', fileName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Error checking source document:", error);
        return { exists: false };
      }

      if (exactMatch) {
        console.log("✅ Source document found:", exactMatch.id);
        return { exists: true, id: exactMatch.id, data: exactMatch.doc_json_extract };
      }

      return { exists: false };
    } catch (error) {
      console.error("❌ Error in checkSourceDocumentExists:", error);
      return { exists: false };
    }
  }

  async checkTargetDocumentsExist(sourceDocId: number, fileNames: string[]): Promise<{ exists: boolean; existingFiles: string[]; targetData?: any }> {
    try {
      console.log("🔍 Checking target documents for source ID:", sourceDocId);
      console.log("🔍 Looking for files:", fileNames);
      
      const { data, error } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', sourceDocId)
        .maybeSingle();

      if (error || !data) {
        console.log("❌ No target documents found");
        return { exists: false, existingFiles: [] };
      }

      const existingFiles: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const titleKey = `doc_title_${i}` as keyof typeof data;
        const title = data[titleKey] as string;
        
        if (title && fileNames.includes(title)) {
          existingFiles.push(title);
          console.log(`✅ Found existing file in slot ${i}:`, title);
        }
      }

      console.log("📋 Existing files found:", existingFiles);
      return { 
        exists: existingFiles.length > 0, 
        existingFiles,
        targetData: data
      };
    } catch (error) {
      console.error("❌ Error checking target documents:", error);
      return { exists: false, existingFiles: [] };
    }
  }

  async clearStaleTargetDocuments(sourceDocId: number): Promise<void> {
    try {
      console.log("🧹 Clearing stale target documents for source ID:", sourceDocId);
      
      const { error } = await supabase
        .from('compare_target_docs')
        .delete()
        .eq('id', sourceDocId);

      if (error) {
        console.error("❌ Error clearing stale target documents:", error);
      } else {
        console.log("✅ Stale target documents cleared");
      }
    } catch (error) {
      console.error("❌ Error in clearStaleTargetDocuments:", error);
    }
  }

  async storeSourceDocument(fileName: string, documentType: string, extractedData: any): Promise<number> {
    const { data: insertedData, error } = await supabase
      .from('compare_source_document')
      .insert({
        doc_title: fileName,
        doc_type: documentType,
        doc_json_extract: extractedData
      })
      .select('id')
      .single();

    if (error) {
      console.error("❌ Database insert error:", error);
      throw error;
    }

    console.log("✅ Source document stored with ID:", insertedData.id);
    return insertedData.id;
  }

  async storeTargetDocuments(sourceDocId: number, processedDocs: any[]): Promise<void> {
    let targetDocData: any = {
      id: sourceDocId
    };

    console.log("📝 Storing documents starting from slot 1 (fresh start)");

    processedDocs.forEach((doc, index) => {
      const slotIndex = index + 1;
      if (slotIndex <= 5) {
        targetDocData[`doc_title_${slotIndex}`] = doc.title;
        targetDocData[`doc_type_${slotIndex}`] = doc.type;
        targetDocData[`doc_json_${slotIndex}`] = doc.json;
        console.log(`📊 Assigned slot ${slotIndex} to:`, doc.title);
      }
    });

    const { error } = await supabase
      .from('compare_target_docs')
      .upsert(targetDocData);

    if (error) {
      console.error("❌ Database upsert error:", error);
      throw error;
    }
  }
}
