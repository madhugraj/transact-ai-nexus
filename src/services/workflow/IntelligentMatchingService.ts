
import { supabase } from '@/integrations/supabase/client';

export interface MatchingCriteria {
  vendorNameSimilarity: number;
  poNumberMatch: boolean;
  amountTolerance: number;
  dateRange: number; // days
  lineItemsMatch: number;
}

export interface ComparisonResult {
  confidenceScore: number;
  matchingCriteria: MatchingCriteria;
  status: 'pending' | 'completed' | 'failed';
  comparisonDetails: any;
}

export class IntelligentMatchingService {
  
  async findPotentialMatches(poNumber: number, userId: string): Promise<any[]> {
    console.log(`🔍 Finding potential matches for PO ${poNumber}`);
    
    try {
      // Get PO details
      const { data: poData, error: poError } = await supabase
        .from('po_table')
        .select('*')
        .eq('po_number', poNumber)
        .eq('user_id', userId)
        .single();

      if (poError || !poData) {
        console.error('❌ PO not found:', poError);
        return [];
      }

      // Find invoices that might match this PO
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoice_table')
        .select('*')
        .eq('user_id', userId)
        .or(`po_number.eq.${poNumber},po_number.is.null`);

      if (invoiceError) {
        console.error('❌ Error fetching invoices:', invoiceError);
        return [];
      }

      console.log(`📊 Found ${invoices?.length || 0} potential invoice matches`);
      return invoices || [];

    } catch (error) {
      console.error('❌ Error in findPotentialMatches:', error);
      return [];
    }
  }

  async performIntelligentComparison(
    poNumber: number, 
    invoiceId: number, 
    userId: string
  ): Promise<ComparisonResult> {
    console.log(`🧠 Performing intelligent comparison: PO ${poNumber} vs Invoice ${invoiceId}`);
    
    try {
      // Check if comparison already exists
      const existingComparison = await this.checkExistingComparison(poNumber, invoiceId, userId);
      if (existingComparison) {
        console.log('✅ Using existing comparison result');
        return existingComparison;
      }

      // Get PO and Invoice data
      const [poData, invoiceData] = await Promise.all([
        this.getPOData(poNumber, userId),
        this.getInvoiceData(invoiceId, userId)
      ]);

      if (!poData || !invoiceData) {
        return {
          confidenceScore: 0,
          matchingCriteria: this.getEmptyMatchingCriteria(),
          status: 'failed',
          comparisonDetails: { error: 'Missing PO or Invoice data' }
        };
      }

      // Perform detailed comparison
      const matchingCriteria = this.calculateMatchingCriteria(poData, invoiceData);
      const confidenceScore = this.calculateConfidenceScore(matchingCriteria);
      
      const comparisonResult: ComparisonResult = {
        confidenceScore,
        matchingCriteria,
        status: 'completed',
        comparisonDetails: {
          poData: {
            po_number: poData.po_number,
            vendor_code: poData.vendor_code,
            description: poData.description
          },
          invoiceData: {
            invoice_number: invoiceData.invoice_number,
            po_number: invoiceData.po_number,
            details: invoiceData.details
          },
          comparisonTimestamp: new Date().toISOString()
        }
      };

      // Store the comparison result
      await this.storeComparisonResult(poNumber, invoiceId, userId, comparisonResult);

      console.log(`✅ Comparison completed with confidence: ${confidenceScore}%`);
      return comparisonResult;

    } catch (error) {
      console.error('❌ Error in performIntelligentComparison:', error);
      return {
        confidenceScore: 0,
        matchingCriteria: this.getEmptyMatchingCriteria(),
        status: 'failed',
        comparisonDetails: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async checkExistingComparison(
    poNumber: number, 
    invoiceId: number, 
    userId: string
  ): Promise<ComparisonResult | null> {
    try {
      const { data, error } = await supabase
        .from('compare_po_invoice_table')
        .select('*')
        .eq('po_file_name', `PO_${poNumber}`)
        .eq('invoice_file_name', `Invoice_${invoiceId}`)
        .eq('created_at', 'desc')
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        confidenceScore: 85, // Default for existing comparisons
        matchingCriteria: this.getEmptyMatchingCriteria(),
        status: 'completed',
        comparisonDetails: data.compare_summary_individual || {}
      };
    } catch (error) {
      console.error('❌ Error checking existing comparison:', error);
      return null;
    }
  }

  private async getPOData(poNumber: number, userId: string) {
    const { data, error } = await supabase
      .from('po_table')
      .select('*')
      .eq('po_number', poNumber)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching PO data:', error);
      return null;
    }

    return data;
  }

  private async getInvoiceData(invoiceId: number, userId: string) {
    const { data, error } = await supabase
      .from('invoice_table')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching invoice data:', error);
      return null;
    }

    return data;
  }

  private calculateMatchingCriteria(poData: any, invoiceData: any): MatchingCriteria {
    // Vendor name similarity using simple string comparison
    const vendorNameSimilarity = this.calculateStringSimilarity(
      poData.vendor_code || '', 
      invoiceData.details?.vendor_name || ''
    );

    // PO number exact match
    const poNumberMatch = poData.po_number === invoiceData.po_number;

    // Amount tolerance check (if amounts are available)
    const amountTolerance = this.calculateAmountTolerance(poData, invoiceData);

    // Date range check
    const dateRange = this.calculateDateRange(poData.po_date, invoiceData.invoice_date);

    // Line items match (simplified)
    const lineItemsMatch = this.calculateLineItemsMatch(poData.description, invoiceData.details);

    return {
      vendorNameSimilarity,
      poNumberMatch,
      amountTolerance,
      dateRange,
      lineItemsMatch
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // Simple substring check
    if (s1.includes(s2) || s2.includes(s1)) return 75;
    
    // First word match
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    if (words1[0] === words2[0]) return 50;
    
    return 0;
  }

  private calculateAmountTolerance(poData: any, invoiceData: any): number {
    // This would need to be implemented based on actual amount fields
    // For now, return a default value
    return 80;
  }

  private calculateDateRange(poDate: string, invoiceDate: string): number {
    if (!poDate || !invoiceDate) return 0;
    
    const po = new Date(poDate);
    const invoice = new Date(invoiceDate);
    const diffDays = Math.abs((invoice.getTime() - po.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return 100;
    if (diffDays <= 60) return 75;
    if (diffDays <= 90) return 50;
    return 25;
  }

  private calculateLineItemsMatch(poDescription: any, invoiceDetails: any): number {
    // Simplified line items matching
    if (!poDescription || !invoiceDetails) return 0;
    
    // This would need more sophisticated logic for actual line item comparison
    return 70;
  }

  private calculateConfidenceScore(criteria: MatchingCriteria): number {
    const weights = {
      vendorNameSimilarity: 0.25,
      poNumberMatch: 0.35,
      amountTolerance: 0.20,
      dateRange: 0.10,
      lineItemsMatch: 0.10
    };

    let score = 0;
    score += criteria.vendorNameSimilarity * weights.vendorNameSimilarity;
    score += (criteria.poNumberMatch ? 100 : 0) * weights.poNumberMatch;
    score += criteria.amountTolerance * weights.amountTolerance;
    score += criteria.dateRange * weights.dateRange;
    score += criteria.lineItemsMatch * weights.lineItemsMatch;

    return Math.round(score);
  }

  private async storeComparisonResult(
    poNumber: number, 
    invoiceId: number, 
    userId: string, 
    result: ComparisonResult
  ) {
    try {
      const { error } = await supabase
        .from('compare_po_invoice_table')
        .insert({
          po_file_name: `PO_${poNumber}`,
          invoice_file_name: `Invoice_${invoiceId}`,
          compare_summary_individual: JSON.stringify({
            confidence_score: result.confidenceScore,
            matching_criteria: result.matchingCriteria,
            comparison_details: result.comparisonDetails
          }),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing comparison result:', error);
      } else {
        console.log('✅ Comparison result stored successfully');
      }
    } catch (error) {
      console.error('❌ Error in storeComparisonResult:', error);
    }
  }

  private getEmptyMatchingCriteria(): MatchingCriteria {
    return {
      vendorNameSimilarity: 0,
      poNumberMatch: false,
      amountTolerance: 0,
      dateRange: 0,
      lineItemsMatch: 0
    };
  }

  async getUnmatchedPOs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('po_table')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching unmatched POs:', error);
        return [];
      }

      // Filter out POs that have successful comparisons
      const unmatchedPOs = data?.filter(po => {
        // This would need to check against comparison results
        // For now, return all POs
        return true;
      }) || [];

      console.log(`📊 Found ${unmatchedPOs.length} unmatched POs`);
      return unmatchedPOs;

    } catch (error) {
      console.error('❌ Error in getUnmatchedPOs:', error);
      return [];
    }
  }

  async getUnmatchedInvoices(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoice_table')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching unmatched invoices:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} unmatched invoices`);
      return data || [];

    } catch (error) {
      console.error('❌ Error in getUnmatchedInvoices:', error);
      return [];
    }
  }
}

export const intelligentMatchingService = new IntelligentMatchingService();
