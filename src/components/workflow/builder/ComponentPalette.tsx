
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, HardDrive, FileText, Database, BarChart3, Bell } from 'lucide-react';

interface ComponentPaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onDragStart }) => {
  const components = [
    { type: 'data-source', label: 'Gmail Source', icon: Mail, color: 'bg-blue-50 border-blue-200' },
    { type: 'data-source', label: 'Drive Source', icon: HardDrive, color: 'bg-green-50 border-green-200' },
    { type: 'document-processing', label: 'Extract Data', icon: FileText, color: 'bg-purple-50 border-purple-200' },
    { type: 'data-storage', label: 'Store Data', icon: Database, color: 'bg-orange-50 border-orange-200' },
    { type: 'analytics', label: 'Generate Report', icon: BarChart3, color: 'bg-yellow-50 border-yellow-200' },
    { type: 'notification', label: 'Send Alert', icon: Bell, color: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-gray-700 mb-3">Drag Components to Canvas</h3>
      {components.map((component, index) => (
        <Card
          key={index}
          className={`${component.color} cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
          draggable
          onDragStart={(e) => onDragStart(e, component.type, component.label)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <component.icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{component.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
