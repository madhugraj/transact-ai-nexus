
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  HardDrive, 
  FileText, 
  Database, 
  BarChart3, 
  Bell,
  GitBranch,
  Zap,
  Plus,
  GitCompare
} from 'lucide-react';
import { WorkflowStepType } from '@/types/workflow';

interface StepTemplate {
  type: WorkflowStepType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const stepTemplates: StepTemplate[] = [
  {
    type: 'data-source',
    name: 'Email Source',
    description: 'Process emails from Gmail with attachments',
    icon: <Mail className="h-5 w-5" />,
    category: 'Input',
    color: 'from-blue-50 to-blue-100 border-blue-200'
  },
  {
    type: 'data-source',
    name: 'Drive Source',
    description: 'Import files from Google Drive folders',
    icon: <HardDrive className="h-5 w-5" />,
    category: 'Input',
    color: 'from-green-50 to-green-100 border-green-200'
  },
  {
    type: 'document-processing',
    name: 'Invoice Extraction',
    description: 'Extract data from invoice documents',
    icon: <FileText className="h-5 w-5" />,
    category: 'Processing',
    color: 'from-purple-50 to-purple-100 border-purple-200'
  },
  {
    type: 'document-processing',
    name: 'PO Extraction',
    description: 'Extract purchase order information',
    icon: <FileText className="h-5 w-5" />,
    category: 'Processing',
    color: 'from-purple-50 to-purple-100 border-purple-200'
  },
  {
    type: 'data-comparison',
    name: 'Process Data',
    description: 'Compare documents intelligently (PO vs Invoice, JD vs CV)',
    icon: <GitCompare className="h-5 w-5" />,
    category: 'Processing',
    color: 'from-amber-50 to-amber-100 border-amber-200'
  },
  {
    type: 'data-validation',
    name: 'Data Validation',
    description: 'Validate extracted data quality',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Processing',
    color: 'from-yellow-50 to-yellow-100 border-yellow-200'
  },
  {
    type: 'conditional',
    name: 'Decision Point',
    description: 'Route data based on conditions',
    icon: <GitBranch className="h-5 w-5" />,
    category: 'Logic',
    color: 'from-red-50 to-red-100 border-red-200'
  },
  {
    type: 'parallel',
    name: 'Parallel Processing',
    description: 'Process multiple documents simultaneously',
    icon: <Zap className="h-5 w-5" />,
    category: 'Logic',
    color: 'from-orange-50 to-orange-100 border-orange-200'
  },
  {
    type: 'data-storage',
    name: 'Database Storage',
    description: 'Store processed data in database',
    icon: <Database className="h-5 w-5" />,
    category: 'Output',
    color: 'from-indigo-50 to-indigo-100 border-indigo-200'
  },
  {
    type: 'analytics',
    name: 'Generate Analytics',
    description: 'Create reports and insights',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Output',
    color: 'from-teal-50 to-teal-100 border-teal-200'
  },
  {
    type: 'notification',
    name: 'Send Notification',
    description: 'Email alerts and notifications',
    icon: <Bell className="h-5 w-5" />,
    category: 'Output',
    color: 'from-pink-50 to-pink-100 border-pink-200'
  }
];

interface WorkflowStepPaletteProps {
  onAddStep: (stepTemplate: StepTemplate) => void;
}

export const WorkflowStepPalette: React.FC<WorkflowStepPaletteProps> = ({ onAddStep }) => {
  const categories = [...new Set(stepTemplates.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Workflow Components</h3>
        <p className="text-sm text-muted-foreground">
          Choose components to build your workflow. Click to add them to the canvas.
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground border-b pb-2">
            {category}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stepTemplates
              .filter(template => template.category === category)
              .map((template, index) => (
                <Card 
                  key={`${template.type}-${index}`}
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-gradient-to-br ${template.color} border-2`}
                  onClick={() => onAddStep(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white shadow-sm text-gray-600">
                          {template.icon}
                        </div>
                        <CardTitle className="text-sm font-semibold">
                          {template.name}
                        </CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-white/50"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
