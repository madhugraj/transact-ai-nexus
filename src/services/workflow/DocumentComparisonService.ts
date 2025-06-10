
import { supabase } from '@/integrations/supabase/client';

export interface ComparisonResult {
  match_percentage: number;
  discrepancies: Array<{
    field: string;
    po_value: any;
    invoice_value: any;
    variance: number | string;
    severity: 'low' | 'medium' | 'high';
  }>;
  line_items_comparison: Array<{
    po_item: any;
    invoice_item: any;
    quantity_variance: number;
    price_variance: number;
    amount_variance: number;
  }>;
  summary: {
    total_po_amount: number;
    total_invoice_amount: number;
    amount_variance: number;
    items_matched: number;
    items_missing: number;
    approval_required: boolean;
  };
}

export class DocumentComparisonService {
  async comparePoWithInvoice(poData: any, invoiceData: any): Promise<ComparisonResult> {
    console.log('🔄 Comparing PO with Invoice:', { 
      poNumber: poData.po_number, 
      invoiceNumber: invoiceData.invoice_number 
    });

    const discrepancies = [];
    const lineItemsComparison = [];
    
    // Compare basic fields
    if (poData.po_number !== invoiceData.po_number) {
      discrepancies.push({
        field: 'po_number',
        po_value: poData.po_number,
        invoice_value: invoiceData.po_number,
        variance: 'Mismatch',
        severity: 'high' as const
      });
    }

    // Compare vendor information
    if (poData.vendor_code && invoiceData.vendor_name) {
      const vendorMatch = this.fuzzyMatch(poData.vendor_code, invoiceData.vendor_name);
      if (vendorMatch < 0.8) {
        discrepancies.push({
          field: 'vendor',
          po_value: poData.vendor_code,
          invoice_value: invoiceData.vendor_name,
          variance: `${Math.round((1 - vendorMatch) * 100)}% difference`,
          severity: 'medium' as const
        });
      }
    }

    // Compare line items
    const poItems = poData.description?.line_items || [];
    const invoiceItems = invoiceData.line_items || [];
    
    let totalPoAmount = 0;
    let totalInvoiceAmount = 0;
    let itemsMatched = 0;

    for (const poItem of poItems) {
      totalPoAmount += parseFloat(poItem.total || 0);
      
      // Find matching invoice item
      const matchingInvoiceItem = invoiceItems.find(invItem => 
        this.fuzzyMatch(poItem.description, invItem.description) > 0.7
      );

      if (matchingInvoiceItem) {
        itemsMatched++;
        const quantityVariance = this.calculateVariance(
          parseFloat(poItem.quantity || 0), 
          parseFloat(matchingInvoiceItem.quantity || 0)
        );
        const priceVariance = this.calculateVariance(
          parseFloat(poItem.unit_price || 0), 
          parseFloat(matchingInvoiceItem.unit_price || 0)
        );
        const amountVariance = this.calculateVariance(
          parseFloat(poItem.total || 0), 
          parseFloat(matchingInvoiceItem.total || 0)
        );

        lineItemsComparison.push({
          po_item: poItem,
          invoice_item: matchingInvoiceItem,
          quantity_variance: quantityVariance,
          price_variance: priceVariance,
          amount_variance: amountVariance
        });

        // Flag significant variances
        if (Math.abs(amountVariance) > 5) {
          discrepancies.push({
            field: `line_item_${poItem.description}`,
            po_value: poItem.total,
            invoice_value: matchingInvoiceItem.total,
            variance: `${amountVariance.toFixed(2)}%`,
            severity: Math.abs(amountVariance) > 10 ? 'high' as const : 'medium' as const
          });
        }
      }
    }

    for (const invItem of invoiceItems) {
      totalInvoiceAmount += parseFloat(invItem.total || 0);
    }

    const totalAmountVariance = this.calculateVariance(totalPoAmount, totalInvoiceAmount);
    const matchPercentage = Math.max(0, 100 - (discrepancies.length * 10) - Math.abs(totalAmountVariance));
    
    return {
      match_percentage: Math.round(matchPercentage),
      discrepancies,
      line_items_comparison: lineItemsComparison,
      summary: {
        total_po_amount: totalPoAmount,
        total_invoice_amount: totalInvoiceAmount,
        amount_variance: totalAmountVariance,
        items_matched: itemsMatched,
        items_missing: poItems.length - itemsMatched,
        approval_required: Math.abs(totalAmountVariance) > 5 || discrepancies.some(d => d.severity === 'high')
      }
    };
  }

  async comparePoWithMultipleInvoices(poData: any, invoicesData: any[]): Promise<any> {
    console.log('🔄 Comparing PO with multiple invoices:', { 
      poNumber: poData.po_number, 
      invoiceCount: invoicesData.length 
    });

    const individualComparisons = [];
    let totalInvoiceAmount = 0;
    let overallMatchPercentage = 0;

    for (const invoice of invoicesData) {
      const comparison = await this.comparePoWithInvoice(poData, invoice);
      individualComparisons.push({
        invoice_number: invoice.invoice_number,
        comparison_result: comparison
      });
      totalInvoiceAmount += comparison.summary.total_invoice_amount;
      overallMatchPercentage += comparison.match_percentage;
    }

    overallMatchPercentage = overallMatchPercentage / invoicesData.length;

    const consolidatedSummary = {
      po_number: poData.po_number,
      total_invoices: invoicesData.length,
      po_total_amount: poData.description?.total_amount || 0,
      invoices_total_amount: totalInvoiceAmount,
      overall_variance: this.calculateVariance(
        poData.description?.total_amount || 0, 
        totalInvoiceAmount
      ),
      overall_match_percentage: Math.round(overallMatchPercentage),
      individual_comparisons: individualComparisons,
      recommendation: overallMatchPercentage > 80 ? 'Approve' : 'Review Required'
    };

    return consolidatedSummary;
  }

  private fuzzyMatch(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    // Simple fuzzy matching based on common words
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  private calculateVariance(value1: number, value2: number): number {
    if (value1 === 0 && value2 === 0) return 0;
    if (value1 === 0) return 100;
    return ((value2 - value1) / value1) * 100;
  }

  async storeComparisonResult(
    comparisonType: 'single' | 'multiple',
    result: any,
    poFileName: string,
    invoiceFileNames: string | string[]
  ): Promise<void> {
    try {
      if (comparisonType === 'single') {
        // Store in compare_po_invoice_table
        const { error } = await supabase
          .from('compare_po_invoice_table')
          .insert({
            po_file_name: poFileName,
            invoice_file_name: Array.isArray(invoiceFileNames) ? invoiceFileNames[0] : invoiceFileNames,
            compare_item_details: result.line_items_comparison,
            compare_bill_details: result.summary,
            compare_summary_individual: JSON.stringify(result),
            po_date: new Date().toISOString().split('T')[0],
            invoice_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
        console.log('✅ Single comparison result stored successfully');
        
      } else {
        // Store in compare_po_multi_invoice
        const { error } = await supabase
          .from('compare_po_multi_invoice')
          .insert({
            po_file_name: poFileName,
            invoice_file_names: invoiceFileNames,
            compaison_summary_all: result
          });

        if (error) throw error;
        console.log('✅ Multi-invoice comparison result stored successfully');
      }
    } catch (error) {
      console.error('❌ Error storing comparison result:', error);
      throw error;
    }
  }
}
