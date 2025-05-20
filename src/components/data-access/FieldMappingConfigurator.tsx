
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Module {
  name: string;
  lastSynced: string;
  recordsFetched: number;
}

interface DataSource {
  name: string;
  type: "CRM" | "Accounting" | "Financial" | "Compliance";
  status: "connected" | "disconnected" | "error";
  modules: Module[];
}

interface FieldMapping {
  agentField: string;
  sourceField: string;
  required: boolean;
}

interface MappingProfile {
  name: string;
  mappings: FieldMapping[];
}

interface FieldMappingConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  source: DataSource | null;
  agentType: "recommendations" | "financial" | "automation" | "compliance";
}

// Mock data for agent fields by agent type
const getAgentFields = (agentType: string, source?: DataSource | null) => {
  const fields: { [key: string]: FieldMapping[] } = {
    "recommendations": [
      { agentField: "Client Name", sourceField: "", required: true },
      { agentField: "Purchase Volume", sourceField: "", required: true },
      { agentField: "Payment History", sourceField: "", required: true },
      { agentField: "Credit Terms", sourceField: "", required: false },
      { agentField: "Last Order Date", sourceField: "", required: false }
    ],
    "financial": [
      { agentField: "Revenue", sourceField: "", required: true },
      { agentField: "Order Volume", sourceField: "", required: true },
      { agentField: "Client ID", sourceField: "", required: true },
      { agentField: "Transaction Date", sourceField: "", required: true },
      { agentField: "Product Category", sourceField: "", required: false }
    ],
    "automation": [
      { agentField: "Transaction ID", sourceField: "", required: true },
      { agentField: "Description", sourceField: "", required: true },
      { agentField: "Amount", sourceField: "", required: true },
      { agentField: "Transaction Date", sourceField: "", required: true },
      { agentField: "Category", sourceField: "", required: false }
    ],
    "compliance": [
      { agentField: "Tax ID", sourceField: "", required: true },
      { agentField: "Address", sourceField: "", required: true },
      { agentField: "Entity Type", sourceField: "", required: true },
      { agentField: "Document Type", sourceField: "", required: false },
      { agentField: "Filing Status", sourceField: "", required: false }
    ]
  };
  
  return fields[agentType] || [];
};

// Mock data for source fields by module
const getSourceFields = (moduleName: string) => {
  const fields: { [key: string]: string[] } = {
    "Contacts": [
      "Contact ID", "First Name", "Last Name", "Full Name", "Email", 
      "Phone", "Mobile", "Address", "City", "State", "Country", 
      "Postal Code", "Last Activity", "Status", "Created Date", "Owner"
    ],
    "Deals": [
      "Deal ID", "Deal Name", "Amount", "Stage", "Close Date", 
      "Probability", "Contact", "Company", "Pipeline", "Owner", 
      "Created Date", "Modified Date", "Expected Revenue"
    ],
    "Activities": [
      "Activity ID", "Type", "Subject", "Due Date", "Status", 
      "Priority", "Related To", "Description", "Duration", 
      "Location", "Owner", "Reminder", "Created Date"
    ],
    "Invoices": [
      "Invoice Number", "Client ID", "Client Name", "Amount", 
      "Tax Amount", "Total", "Issue Date", "Due Date", "Status", 
      "Currency", "PO Number", "Terms", "Notes", "Created By", 
      "Created Date", "Line Items"
    ],
    "Payments": [
      "Payment ID", "Invoice ID", "Client ID", "Client Name", 
      "Amount", "Payment Date", "Payment Method", "Reference Number", 
      "Notes", "Status", "Created Date", "Created By", "Currency"
    ]
  };
  
  return fields[moduleName] || [];
};

// Mock saved mapping profiles
const savedProfiles = [
  { name: "Default Recommendation Mapping", mappings: [] },
  { name: "Custom Finance Mapping", mappings: [] },
  { name: "Compliance - Standard", mappings: [] }
];

export function FieldMappingConfigurator({ 
  isOpen, 
  onClose, 
  source, 
  agentType 
}: FieldMappingConfiguratorProps) {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const { toast } = useToast();
  
  // Set initial module when source changes
  if (source && source.modules.length > 0 && (!selectedModule || !source.modules.find(m => m.name === selectedModule))) {
    setSelectedModule(source.modules[0].name);
  }
  
  // Reset mappings when agent type or module changes
  if (mappings.length === 0) {
    setMappings(getAgentFields(agentType));
  }
  
  // Get source fields for the selected module
  const sourceFields = selectedModule ? getSourceFields(selectedModule) : [];
  
  // Update a single field mapping
  const updateMapping = (index: number, sourceField: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], sourceField };
    setMappings(newMappings);
  };
  
  // Save the current mapping as a profile
  const saveProfile = () => {
    if (!profileName) {
      toast({
        title: "Profile name is required",
        description: "Please enter a name for this mapping profile",
        variant: "destructive"
      });
      return;
    }
    
    if (mappings.some(m => m.required && !m.sourceField)) {
      toast({
        title: "Required fields missing",
        description: "Please map all required fields before saving",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, we would save this to the backend
    toast({
      title: "Profile saved",
      description: `Mapping profile "${profileName}" has been saved successfully`
    });
  };
  
  // Load a saved profile
  const loadProfile = (profileName: string) => {
    // In a real app, we would load the profile from the backend
    setSelectedProfile(profileName);
    toast({
      title: "Profile loaded",
      description: `Mapping profile "${profileName}" has been loaded`
    });
  };
  
  // Check if all required fields are mapped
  const hasRequiredMappings = mappings.every(m => !m.required || m.sourceField);
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {source ? `${source.name} - Field Mapping Configuration` : 'Field Mapping'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center my-4">
          <div className="flex items-center gap-4">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {source?.modules.map((module, index) => (
                  <SelectItem key={index} value={module.name}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {sourceFields.length} available fields
            </Badge>
          </div>
          
          <div>
            <Select value={selectedProfile} onValueChange={loadProfile}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Load saved profile" />
              </SelectTrigger>
              <SelectContent>
                {savedProfiles.map((profile, index) => (
                  <SelectItem key={index} value={profile.name}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4 max-h-[40vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Required Agent Fields</h3>
              
              {mappings.filter(m => m.required).map((mapping, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{mapping.agentField}</span>
                      <Badge className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">Required</Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Select 
                      value={mapping.sourceField} 
                      onValueChange={(value) => updateMapping(
                        mappings.findIndex(m => m.agentField === mapping.agentField), value
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceFields.map((field, idx) => (
                          <SelectItem key={idx} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!mapping.sourceField && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {mapping.sourceField && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
              
              <h3 className="text-sm font-medium mt-6">Optional Agent Fields</h3>
              
              {mappings.filter(m => !m.required).map((mapping, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{mapping.agentField}</span>
                      <Badge className="bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400">Optional</Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Select 
                      value={mapping.sourceField} 
                      onValueChange={(value) => updateMapping(
                        mappings.findIndex(m => m.agentField === mapping.agentField), value
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceFields.map((field, idx) => (
                          <SelectItem key={idx} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex items-center gap-4 mt-4">
          <Input 
            placeholder="Profile name" 
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={saveProfile} 
            disabled={!profileName || !hasRequiredMappings}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Profile
          </Button>
        </div>
        
        {!hasRequiredMappings && (
          <div className="text-amber-500 text-sm flex items-center gap-1 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Please map all required fields before saving</span>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={onClose} 
            disabled={!hasRequiredMappings}
          >
            Apply Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
