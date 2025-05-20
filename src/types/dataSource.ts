
// Define types for data sources

export interface Module {
  name: string;
  lastSynced: string;
  recordsFetched: number;
}

export interface DataSource {
  name: string;
  type: "CRM" | "Accounting" | "Financial" | "Compliance";
  status: "connected" | "disconnected" | "error";
  modules: Module[];
}

export interface DataSourceConfig {
  sources: DataSource[];
  lastRefreshed?: string;
  hasErrors?: boolean;
}

export interface FieldMapping {
  agentField: string;
  sourceField: string;
  required: boolean;
}

export interface MappingProfile {
  id: string;
  name: string;
  agentType: "recommendations" | "financial" | "automation" | "compliance";
  sourceId: string;
  mappings: FieldMapping[];
}
