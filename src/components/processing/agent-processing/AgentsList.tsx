
import React from 'react';
import { FileText, Settings, Layers, Sparkles } from 'lucide-react';
import { AgentInfo } from '@/hooks/useAgentProcessing';

interface AgentsListProps {
  agents: AgentInfo[];
  activeAgentId: string | null;
  setActiveAgentId: (id: string) => void;
}

export const AgentsList: React.FC<AgentsListProps> = ({ 
  agents, 
  activeAgentId, 
  setActiveAgentId 
}) => {
  // Get icon for agent type
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'DataInput': return <FileText className="h-5 w-5" />;
      case 'OCRExtraction': return <Settings className="h-5 w-5" />;
      case 'PDFTableExtraction': return <FileText className="h-5 w-5" />;
      case 'DynamicTableDetection': return <Layers className="h-5 w-5" />;
      case 'DisplayAgent': return <Sparkles className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Processing Agents with Gemini AI</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`p-3 border rounded-md cursor-pointer transition-colors
              ${activeAgentId === agent.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            onClick={() => setActiveAgentId(agent.id)}
          >
            <div className="flex items-center">
              {getAgentIcon(agent.id)}
              <div className="ml-3">
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
