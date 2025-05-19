
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number | string;
  unitPrice: number | string;
  description?: string;
  sku?: string;
  category?: string;
  [key: string]: any; // For other dynamic properties
}

export interface MappingTarget {
  id: string;
  name: string;
  type: 'SAP' | 'QuickBooks' | 'Xero' | 'Zoho';
  code: string;
  description?: string;
}

export interface MappingResult {
  sourceItemId: string;
  targetCode: string;
  targetSystem: string;
  confidenceScore?: number;
  isConfirmed: boolean;
  isAmbiguous: boolean;
}

export interface MappingProfile {
  id: string;
  name: string;
  targetSystem: string;
  description?: string;
  mappings: Record<string, string>; // sourceItemId -> targetCode
  createdAt: string;
}

export interface InventoryMappingState {
  sourceItems: InventoryItem[];
  mappingResults: Record<string, MappingResult>;
  selectedProfile?: MappingProfile;
  profiles: MappingProfile[];
  selectedTargetSystem: string;
}
