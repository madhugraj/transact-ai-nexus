
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SourceTableViewer } from "./SourceTableViewer";
import { MappingTable } from "./MappingTable";
import { MappingProfileSelector } from "./MappingProfileSelector";
import { FileUploader } from "./FileUploader";
import { extractTablesFromImageWithGemini } from "@/services/api/gemini/tableExtractor";
import { InventoryItem, MappingResult, MappingProfile } from "@/types/inventoryMapping";
import { parseInventoryFile } from "@/utils/inventoryParser";
import { Brain, Save, FileSpreadsheet, ArrowRight } from "lucide-react";

export function InventoryMappingPanel() {
  const [sourceItems, setSourceItems] = useState<InventoryItem[]>([]);
  const [mappingResults, setMappingResults] = useState<Record<string, MappingResult>>({});
  const [profiles, setProfiles] = useState<MappingProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load available profiles from localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem('mappingProfiles');
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (error) {
        console.error("Failed to parse saved profiles:", error);
      }
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      // If it's an image, use Gemini to extract tables
      if (file.type.startsWith('image/')) {
        const base64Image = await fileToBase64(file);
        const result = await extractTablesFromImageWithGemini(base64Image, file.type);
        
        if (result.success && result.data.tables && result.data.tables.length > 0) {
          const table = result.data.tables[0];
          const items = convertTableToInventoryItems(table.headers, table.rows);
          setSourceItems(items);
          initializeMappingResults(items);
        } else {
          throw new Error("Failed to extract table from image");
        }
      } else {
        // For CSV, Excel, or JSON files
        const items = await parseInventoryFile(file);
        setSourceItems(items);
        initializeMappingResults(items);
      }
      
      setFileUploaded(true);
      toast({
        title: "File processed successfully",
        description: `Extracted ${sourceItems.length} inventory items`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const initializeMappingResults = (items: InventoryItem[]) => {
    const initialResults: Record<string, MappingResult> = {};
    
    items.forEach((item) => {
      initialResults[item.id] = {
        sourceItemId: item.id,
        targetCode: "",
        targetSystem: "",
        confidenceScore: 0,
        isConfirmed: false,
        isAmbiguous: true,
      };
    });
    
    setMappingResults(initialResults);
  };

  const runAutoMatch = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would call an API to get matches
      // For now, let's simulate a delay and generate random matches
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedResults = { ...mappingResults };
      
      sourceItems.forEach((item) => {
        // Random confidence score between 60-100
        const confidenceScore = Math.floor(Math.random() * 41) + 60;
        
        // Simulate different target systems
        const systems = ['SAP', 'QuickBooks', 'Xero', 'Zoho'];
        const targetSystem = systems[Math.floor(Math.random() * systems.length)];
        
        // Generate a fake target code based on the item name
        const targetCode = generateFakeTargetCode(item.name, targetSystem);
        
        updatedResults[item.id] = {
          ...updatedResults[item.id],
          targetCode,
          targetSystem,
          confidenceScore,
          isAmbiguous: confidenceScore < 80,
        };
      });
      
      setMappingResults(updatedResults);
      
      toast({
        title: "Auto-matching complete",
        description: `Generated suggestions for ${sourceItems.length} items`,
      });
    } catch (error) {
      toast({
        title: "Auto-matching failed",
        description: error instanceof Error ? error.message : "Failed to run auto-matching",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingUpdate = (itemId: string, targetCode: string, targetSystem: string) => {
    setMappingResults((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        targetCode,
        targetSystem,
        isConfirmed: true,
        isAmbiguous: false,
      },
    }));
  };

  const handleConfirmAllMappings = () => {
    const updatedResults = { ...mappingResults };
    
    Object.keys(updatedResults).forEach((itemId) => {
      if (updatedResults[itemId].targetCode) {
        updatedResults[itemId].isConfirmed = true;
        updatedResults[itemId].isAmbiguous = false;
      }
    });
    
    setMappingResults(updatedResults);
    
    toast({
      title: "Mappings confirmed",
      description: "All valid mappings have been confirmed",
    });
  };

  const saveAsProfile = () => {
    const profileName = prompt("Enter a name for this mapping profile:");
    if (!profileName) return;
    
    const mappings: Record<string, string> = {};
    Object.values(mappingResults).forEach((result) => {
      if (result.isConfirmed && result.targetCode) {
        mappings[result.sourceItemId] = result.targetCode;
      }
    });
    
    const newProfile: MappingProfile = {
      id: `profile_${Date.now()}`,
      name: profileName,
      targetSystem: Object.values(mappingResults)[0]?.targetSystem || "Unknown",
      mappings,
      createdAt: new Date().toISOString(),
    };
    
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    
    localStorage.setItem('mappingProfiles', JSON.stringify(updatedProfiles));
    
    toast({
      title: "Profile saved",
      description: `Mapping profile "${profileName}" has been saved`,
    });
  };

  const applyProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const updatedResults = { ...mappingResults };
    
    Object.entries(profile.mappings).forEach(([sourceId, targetCode]) => {
      if (updatedResults[sourceId]) {
        updatedResults[sourceId] = {
          ...updatedResults[sourceId],
          targetCode,
          targetSystem: profile.targetSystem,
          isConfirmed: true,
          isAmbiguous: false,
        };
      }
    });
    
    setMappingResults(updatedResults);
    setSelectedProfile(profileId);
    
    toast({
      title: "Profile applied",
      description: `Mapping profile "${profile.name}" has been applied`,
    });
  };

  const handleFinalize = () => {
    // Check if all items have been mapped
    const unmappedItems = Object.values(mappingResults).filter(
      (result) => !result.isConfirmed || !result.targetCode
    );
    
    if (unmappedItems.length > 0) {
      const shouldProceed = confirm(
        `There are ${unmappedItems.length} unmapped items. Do you want to proceed anyway?`
      );
      
      if (!shouldProceed) return;
    }
    
    // Prepare the final mapping data
    const finalMapping = {
      timestamp: new Date().toISOString(),
      sourceItems,
      mappingResults,
      profile: selectedProfile ? profiles.find(p => p.id === selectedProfile) : undefined,
    };
    
    // In a real implementation, this would be sent to a backend API
    console.log("Final mapping data:", finalMapping);
    
    // For demonstration, save to localStorage
    localStorage.setItem('lastMappingResult', JSON.stringify(finalMapping));
    
    toast({
      title: "Mapping finalized",
      description: "The inventory mapping has been finalized and saved",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          {!fileUploaded ? (
            <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Inventory Mapping</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFileUploaded(false)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Upload New File
                  </Button>
                  
                  <MappingProfileSelector 
                    profiles={profiles}
                    selectedProfile={selectedProfile}
                    onSelectProfile={applyProfile}
                  />
                </div>
              </div>

              <SourceTableViewer items={sourceItems} />
              
              <div className="flex justify-between items-center bg-blue-50/30 p-3 rounded-md border border-blue-100">
                <div className="flex items-center">
                  <ArrowRight className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Source to Target Mapping</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={runAutoMatch}
                  disabled={isProcessing}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Auto-Match
                </Button>
              </div>
              
              <MappingTable 
                sourceItems={sourceItems}
                mappingResults={mappingResults}
                onUpdateMapping={handleMappingUpdate}
              />

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveAsProfile}
                    disabled={Object.values(mappingResults).filter(r => r.isConfirmed).length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleConfirmAllMappings}
                  >
                    Confirm All Mappings
                  </Button>
                </div>
                <Button
                  onClick={handleFinalize}
                  disabled={Object.values(mappingResults).every(r => !r.isConfirmed)}
                >
                  Finalize Mapping
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to convert table data to inventory items
const convertTableToInventoryItems = (headers: string[], rows: any[][]): InventoryItem[] => {
  return rows.map((row, index) => {
    const item: Record<string, any> = {
      id: `item_${index}`,
    };
    
    headers.forEach((header, colIndex) => {
      // Normalize the header to create a property name
      const propName = header.toLowerCase().replace(/\s+/g, '_');
      item[propName] = row[colIndex];
      
      // Try to detect common inventory fields
      if (header.toLowerCase().includes('name') || header.toLowerCase().includes('item')) {
        item.name = row[colIndex];
      } else if (header.toLowerCase().includes('quantity') || header.toLowerCase().includes('qty')) {
        item.quantity = row[colIndex];
      } else if (header.toLowerCase().includes('price') || header.toLowerCase().includes('cost')) {
        item.unitPrice = row[colIndex];
      } else if (header.toLowerCase().includes('description') || header.toLowerCase().includes('desc')) {
        item.description = row[colIndex];
      } else if (header.toLowerCase().includes('sku') || header.toLowerCase().includes('code')) {
        item.sku = row[colIndex];
      }
    });
    
    // Ensure required fields are present
    if (!item.name) item.name = `Item ${index + 1}`;
    if (!item.quantity) item.quantity = 0;
    if (!item.unitPrice) item.unitPrice = 0;
    
    return item as InventoryItem;
  });
};

// Helper function to generate fake target codes for the demo
const generateFakeTargetCode = (itemName: string, system: string): string => {
  const prefix = system === 'SAP' 
    ? 'MAT' 
    : system === 'QuickBooks' 
      ? 'QB' 
      : system === 'Xero' 
        ? 'XER' 
        : 'ZOH';
  
  // Take first 3 characters of item name, uppercase them
  const itemPrefix = itemName.substring(0, 3).toUpperCase();
  
  // Generate a random 6-digit number
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  
  return `${prefix}-${itemPrefix}${randomNum}`;
};
