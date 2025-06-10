
import { WorkflowTemplate } from '@/types/workflow';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'basic-invoice-processing',
    name: 'Basic Invoice Processing',
    description: 'Simple workflow to extract and store invoice data from email attachments',
    category: 'invoice-processing', // Correct category
    steps: [
      {
        type: 'data-source',
        name: 'Gmail Source',
        description: 'Fetch emails with invoice attachments',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            attachmentTypes: ['pdf', 'png', 'jpg'],
            useIntelligentFiltering: true,
            intelligentRules: {
              detectInvoices: true,
              checkAttachments: true,
              aiConfidenceThreshold: 0.8
            }
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract Invoice Data',
        description: 'Extract structured data from invoice documents',
        position: { x: 300, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini',
            confidence: 0.85
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store in Database',
        description: 'Save extracted invoice data to database',
        position: { x: 500, y: 100 },
        config: {
          storageConfig: {
            table: 'invoice_table',
            action: 'insert'
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '1' },
      { sourceStepId: '1', targetStepId: '2' }
    ]
  },
  {
    id: 'po-invoice-comparison',
    name: 'PO vs Invoice Comparison',
    description: 'Compare Purchase Orders with received invoices for discrepancy analysis',
    category: 'comparison-analysis', // Different category
    steps: [
      {
        type: 'data-source',
        name: 'Gmail Invoice Source',
        description: 'Fetch invoice emails',
        position: { x: 100, y: 50 },
        config: {
          emailConfig: {
            source: 'gmail',
            attachmentTypes: ['pdf'],
            useIntelligentFiltering: true,
            intelligentRules: {
              detectInvoices: true,
              checkAttachments: true,
              aiConfidenceThreshold: 0.8
            }
          }
        }
      },
      {
        type: 'data-source',
        name: 'Drive PO Source',
        description: 'Fetch PO documents from Drive',
        position: { x: 100, y: 200 },
        config: {
          driveConfig: {
            source: 'google-drive',
            folderPath: '/PO Documents',
            fileTypes: ['pdf', 'xlsx'],
            processSubfolders: true
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Process Invoices',
        description: 'Extract invoice data',
        position: { x: 300, y: 50 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Process POs',
        description: 'Extract PO data',
        position: { x: 300, y: 200 },
        config: {
          processingConfig: {
            type: 'po-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'data-comparison',
        name: 'Compare PO vs Invoice',
        description: 'Intelligent comparison with discrepancy detection',
        position: { x: 500, y: 125 },
        config: {
          comparisonConfig: {
            type: 'po-invoice-comparison',
            useIntelligentMatching: true,
            matchingCriteria: 'fuzzy',
            tolerance: 0.02
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store Results',
        description: 'Save comparison results',
        position: { x: 700, y: 125 },
        config: {
          storageConfig: {
            table: 'compare_po_invoice_table',
            action: 'insert'
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '2' },
      { sourceStepId: '1', targetStepId: '3' },
      { sourceStepId: '2', targetStepId: '4' },
      { sourceStepId: '3', targetStepId: '4' },
      { sourceStepId: '4', targetStepId: '5' }
    ]
  },
  {
    id: 'multi-invoice-processing',
    name: 'Multi-Invoice Processing',
    description: 'Batch process multiple invoices against stored PO database',
    category: 'batch-processing', // Different category
    steps: [
      {
        type: 'data-source',
        name: 'Batch Invoice Source',
        description: 'Collect multiple invoices from various sources',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            attachmentTypes: ['pdf', 'png', 'jpg'],
            useIntelligentFiltering: true,
            intelligentRules: {
              detectInvoices: true,
              checkAttachments: true,
              aiConfidenceThreshold: 0.8
            }
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Batch Process Invoices',
        description: 'Extract data from multiple invoices simultaneously',
        position: { x: 300, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini',
            confidence: 0.85
          }
        }
      },
      {
        type: 'data-comparison',
        name: 'Match with Stored POs',
        description: 'Compare against existing PO database',
        position: { x: 500, y: 100 },
        config: {
          comparisonConfig: {
            type: 'po-invoice-comparison',
            sourceTable: 'po_table',
            useIntelligentMatching: true,
            matchingCriteria: 'threshold',
            tolerance: 0.05
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store Multi Results',
        description: 'Save batch processing results',
        position: { x: 700, y: 100 },
        config: {
          storageConfig: {
            table: 'compare_po_multi_invoice',
            action: 'upsert'
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '1' },
      { sourceStepId: '1', targetStepId: '2' },
      { sourceStepId: '2', targetStepId: '3' }
    ]
  }
];
