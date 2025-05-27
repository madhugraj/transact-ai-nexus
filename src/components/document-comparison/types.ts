
// Types for document comparison
export interface DocumentDetails {
  vendor?: string;
  amount?: number;
  quantity?: string;
  date?: string;
  documentNumber?: string;
}

export interface ComparisonResult {
  field: string;
  poValue: string | number;
  invoiceValue: string | number;
  match: boolean;
  sourceValue?: string | number;
  targetValue?: string | number;
}

export interface DetailedComparisonResult {
  overallMatch: number;
  headerResults: ComparisonResult[];
  lineItems: any[];
  sourceDocument: any;
  targetDocuments: any[];
  comparisonSummary: any;
}
