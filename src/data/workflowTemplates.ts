
import { WorkflowTemplate } from '@/types/workflow';

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'invoice-processing-template',
    name: 'Complete Invoice Processing',
    description: 'Email → Extract Invoices → Validate → Store → Analytics',
    category: 'invoice-processing',
    steps: [
      {
        type: 'data-source',
        name: 'Email Source',
        description: 'Monitor Gmail for new emails with attachments',
        position: { x: 100, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            attachmentTypes: ['pdf', 'png', 'jpg'],
            filters: ['invoice', 'billing']
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract Invoice Data',
        description: 'Use AI to extract structured data from invoices',
        position: { x: 300, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini',
            confidence: 0.8
          }
        }
      },
      {
        type: 'data-validation',
        name: 'Validate Data',
        description: 'Validate extracted invoice data',
        position: { x: 500, y: 100 },
        config: {}
      },
      {
        type: 'data-storage',
        name: 'Store in Database',
        description: 'Store validated invoice data',
        position: { x: 700, y: 100 },
        config: {
          storageConfig: {
            table: 'invoice_table',
            action: 'insert'
          }
        }
      },
      {
        type: 'analytics',
        name: 'Generate Analytics',
        description: 'Create invoice analytics and reports',
        position: { x: 900, y: 100 },
        config: {
          analyticsConfig: {
            type: 'summary',
            parameters: { period: 'monthly' }
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '1' },
      { sourceStepId: '1', targetStepId: '2' },
      { sourceStepId: '2', targetStepId: '3' },
      { sourceStepId: '3', targetStepId: '4' }
    ]
  },
  {
    id: 'po-processing-template',
    name: 'Purchase Order Processing',
    description: 'Drive → Extract POs → Validate → Store → Compare with Invoices',
    category: 'po-processing',
    steps: [
      {
        type: 'data-source',
        name: 'Google Drive Source',
        description: 'Monitor Google Drive for PO documents',
        position: { x: 100, y: 200 },
        config: {
          driveConfig: {
            source: 'google-drive',
            fileTypes: ['pdf'],
            folderPath: '/POs'
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Extract PO Data',
        description: 'Extract structured data from Purchase Orders',
        position: { x: 300, y: 200 },
        config: {
          processingConfig: {
            type: 'po-extraction',
            aiModel: 'gemini',
            confidence: 0.85
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store PO Data',
        description: 'Store PO data in database',
        position: { x: 500, y: 200 },
        config: {
          storageConfig: {
            table: 'po_table',
            action: 'upsert'
          }
        }
      },
      {
        type: 'analytics',
        name: 'PO vs Invoice Analysis',
        description: 'Compare POs with received invoices',
        position: { x: 700, y: 200 },
        config: {
          analyticsConfig: {
            type: 'comparison',
            parameters: { compareWith: 'invoices' }
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '1' },
      { sourceStepId: '1', targetStepId: '2' },
      { sourceStepId: '2', targetStepId: '3' }
    ]
  },
  {
    id: 'complete-workflow-template',
    name: 'Complete Document Workflow',
    description: 'Multi-source → Process All Document Types → Store → Analytics → Notifications',
    category: 'general',
    steps: [
      {
        type: 'data-source',
        name: 'Email Monitor',
        description: 'Monitor Gmail for documents',
        position: { x: 50, y: 100 },
        config: {
          emailConfig: {
            source: 'gmail',
            attachmentTypes: ['pdf', 'png', 'jpg']
          }
        }
      },
      {
        type: 'data-source',
        name: 'Drive Monitor',
        description: 'Monitor Google Drive for documents',
        position: { x: 50, y: 250 },
        config: {
          driveConfig: {
            source: 'google-drive',
            fileTypes: ['pdf']
          }
        }
      },
      {
        type: 'conditional',
        name: 'Document Type Router',
        description: 'Route documents based on type',
        position: { x: 300, y: 175 },
        config: {
          conditionalConfig: {
            condition: 'isInvoice',
            trueStepId: '3',
            falseStepId: '4'
          }
        }
      },
      {
        type: 'document-processing',
        name: 'Invoice Processing',
        description: 'Process invoice documents',
        position: { x: 500, y: 100 },
        config: {
          processingConfig: {
            type: 'invoice-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'document-processing',
        name: 'PO Processing',
        description: 'Process PO documents',
        position: { x: 500, y: 250 },
        config: {
          processingConfig: {
            type: 'po-extraction',
            aiModel: 'gemini'
          }
        }
      },
      {
        type: 'data-storage',
        name: 'Store All Data',
        description: 'Store processed data in appropriate tables',
        position: { x: 700, y: 175 },
        config: {
          storageConfig: {
            table: 'dynamic',
            action: 'upsert'
          }
        }
      },
      {
        type: 'analytics',
        name: 'Comprehensive Analytics',
        description: 'Generate comprehensive business analytics',
        position: { x: 900, y: 175 },
        config: {
          analyticsConfig: {
            type: 'trends',
            parameters: { includeAll: true }
          }
        }
      }
    ],
    connections: [
      { sourceStepId: '0', targetStepId: '2' },
      { sourceStepId: '1', targetStepId: '2' },
      { sourceStepId: '2', targetStepId: '3', condition: 'isInvoice' },
      { sourceStepId: '2', targetStepId: '4', condition: 'isPO' },
      { sourceStepId: '3', targetStepId: '5' },
      { sourceStepId: '4', targetStepId: '5' },
      { sourceStepId: '5', targetStepId: '6' }
    ]
  }
];
