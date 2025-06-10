
import { WorkflowTemplate } from '@/types/workflow';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'invoice-processing-basic',
    name: 'Basic Invoice Processing',
    description: 'Extract invoice data from emails and store in database',
    category: 'invoice-processing',
    steps: [
      {
        type: 'data-source',
        name: 'Gmail Source',
        description: 'Fetch emails with invoice attachments',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            filters: ['invoice', 'billing', 'payment'],
            attachmentTypes: ['pdf'],
            useIntelligentFiltering: true
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract Invoice Data',
        description: 'Extract structured data from invoice PDFs',
        position: { x: 400, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini',
            confidence: 0.8
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store Invoice Data',
        description: 'Store extracted invoice data in database',
        position: { x: 700, y: 100 },
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
    description: 'Compare Purchase Orders with Invoices for approval workflow',
    category: 'invoice-processing',
    steps: [
      {
        type: 'data-source',
        name: 'Gmail Source',
        description: 'Fetch emails with invoice attachments',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            filters: ['invoice', 'billing'],
            attachmentTypes: ['pdf'],
            useIntelligentFiltering: true
          }
        }
      },
      {
        type: 'data-source',
        name: 'Drive Source',
        description: 'Fetch PO documents from Drive',
        position: { x: 100, y: 300 },
        config: {
          driveConfig: {
            source: 'google-drive',
            folderPath: '/PO Documents',
            fileTypes: ['pdf']
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract Invoice Data',
        description: 'Extract data from invoice documents',
        position: { x: 400, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract PO Data',
        description: 'Extract data from PO documents',
        position: { x: 400, y: 300 },
        config: {
          processingConfig: {
            type: 'po-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'data-comparison',
        name: 'Process Data',
        description: 'Compare PO and Invoice data intelligently',
        position: { x: 700, y: 200 },
        config: {
          comparisonConfig: {
            type: 'po-invoice-comparison',
            fields: ['po_number', 'vendor', 'line_items', 'total_amount'],
            tolerance: 5,
            matchingCriteria: 'fuzzy'
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store Comparison Results',
        description: 'Store comparison results in database',
        position: { x: 1000, y: 200 },
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
    name: 'Multi-Invoice vs PO Processing',
    description: 'Process multiple invoices against single PO for consolidation',
    category: 'invoice-processing',
    steps: [
      {
        type: 'data-source',
        name: 'Gmail Source',
        description: 'Fetch multiple invoice emails',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            filters: ['invoice', 'billing'],
            attachmentTypes: ['pdf'],
            useIntelligentFiltering: true
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract Invoice Data',
        description: 'Extract data from multiple invoices',
        position: { x: 400, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'data-comparison',
        name: 'Process Data',
        description: 'Compare multiple invoices with stored POs',
        position: { x: 700, y: 100 },
        config: {
          comparisonConfig: {
            type: 'po-invoice-comparison',
            fields: ['po_number', 'vendor', 'line_items'],
            tolerance: 3,
            matchingCriteria: 'exact'
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store Multi-Invoice Results',
        description: 'Store consolidated comparison results',
        position: { x: 1000, y: 100 },
        config: {
          storageConfig: {
            table: 'compare_po_multi_invoice',
            action: 'insert'
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
