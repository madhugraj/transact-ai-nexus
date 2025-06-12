
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, HardDrive, FileText, Database, BarChart3, Bell, GitCompare } from 'lucide-react';

interface ComponentPaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onDragStart }) => {
  const components = [
    { type: 'data-source', label: 'Gmail Source', icon: Mail, color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600' },
    { type: 'data-source', label: 'Drive Source', icon: HardDrive, color: 'bg-green-50 border-green-200', iconColor: 'text-green-600' },
    { type: 'document-processing', label: 'Extract Data', icon: FileText, color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600' },
    { type: 'data-comparison', label: 'Process Data', icon: GitCompare, color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600' },
    { type: 'data-storage', label: 'Store Data', icon: Database, color: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600' },
    { type: 'analytics', label: 'Generate Report', icon: BarChart3, color: 'bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-600' },
    { type: 'notification', label: 'Send Alert', icon: Bell, color: 'bg-red-50 border-red-200', iconColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-1.5">
      <h3 className="font-medium text-xs text-gray-700 mb-2 uppercase tracking-wide">Components</h3>
      {components.map((component, index) => (
        <Card
          key={index}
          className={`${component.color} cursor-grab active:cursor-grabbing hover:shadow-sm transition-all duration-200 hover:scale-102`}
          draggable
          onDragStart={(e) => onDragStart(e, component.type, component.label)}
        >
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded bg-white/50 ${component.iconColor}`}>
                <component.icon className="h-3 w-3" />
              </div>
              <span className="text-xs font-medium text-gray-700 leading-tight">{component.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
