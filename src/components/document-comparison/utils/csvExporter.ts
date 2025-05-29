
import { DetailedComparisonResult } from '../types';

export const exportToCSV = (detailedResults: DetailedComparisonResult): void => {
  const csvData: string[] = [];
  
  // Add header
  csvData.push('Document Type,Source Document,Target Document,Field,Source Value,Target Value,Match Percentage,Weight,Status,Issues,Recommendations');
  
  // Process each target document
  detailedResults.comparisonSummary?.target_specific_results?.forEach((target: any, targetIndex: number) => {
    const targetDoc = detailedResults.targetDocuments?.[targetIndex];
    
    if (target.fields && Array.isArray(target.fields)) {
      target.fields.forEach((field: any) => {
        const sourceValue = formatCSVValue(field.source_value);
        const targetValue = formatCSVValue(field.target_value);
        const matchPercentage = (field.match_percentage || 0).toFixed(1);
        const weight = Math.round((field.weight || 0) * 100);
        const status = field.match ? 'Match' : 'No Match';
        
        // Get issues and recommendations for this target
        const issues = target.detailed_analysis?.critical_issues?.join('; ') || 'No issues';
        const recommendations = target.detailed_analysis?.recommendations?.join('; ') || 'No recommendations';
        
        csvData.push(
          `"${detailedResults.sourceDocument?.doc_type || 'Unknown'}","${detailedResults.sourceDocument?.doc_title || 'Unknown'}","${targetDoc?.title || 'Unknown'}","${field.field}","${sourceValue}","${targetValue}","${matchPercentage}%","${weight}%","${status}","${issues}","${recommendations}"`
        );
      });
    }
  });
  
  // Create and download the CSV file
  const csvContent = csvData.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatCSVValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map(item => 
      typeof item === 'string' ? item : (typeof item === 'object' ? JSON.stringify(item) : String(item))
    ).join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Escape quotes for CSV
  return String(value).replace(/"/g, '""');
};
