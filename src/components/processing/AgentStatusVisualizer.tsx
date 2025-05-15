
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AgentStatusVisualizerProps {
  activeAgent: string | null;
  agentsHistory: Array<{
    id: string;
    status: 'pending' | 'active' | 'complete' | 'error';
    timestamp: Date;
  }>;
  agents: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

const AgentStatusVisualizer: React.FC<AgentStatusVisualizerProps> = ({
  activeAgent,
  agentsHistory,
  agents
}) => {
  // Get status for each agent
  const getAgentStatus = (agentId: string) => {
    // Find the most recent status for this agent
    const history = agentsHistory
      .filter(item => item.id === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return history.length > 0 ? history[0].status : 'pending';
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const totalAgents = agents.length;
    const completedAgents = agentsHistory.filter(item => item.status === 'complete').length;
    return Math.round((completedAgents / totalAgents) * 100);
  };

  // Group agents by status
  const pendingAgents = agents.filter(agent => getAgentStatus(agent.id) === 'pending');
  const activeAgents = agents.filter(agent => getAgentStatus(agent.id) === 'active');
  const completedAgents = agents.filter(agent => getAgentStatus(agent.id) === 'complete');
  const errorAgents = agents.filter(agent => getAgentStatus(agent.id) === 'error');

  return (
    <Card className="border border-muted/60 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Agent Processing Status</h3>
            <Badge variant={errorAgents.length > 0 ? "destructive" : "outline"}>
              {errorAgents.length > 0 ? 'Error' : 
               activeAgents.length > 0 ? 'Processing' : 
               completedAgents.length === agents.length ? 'Complete' : 'Pending'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-1.5" />
          </div>
          
          <div className="space-y-2 mt-3">
            {activeAgents.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
                <h4 className="text-xs font-medium text-blue-700 mb-1">Currently Processing</h4>
                {activeAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center text-sm py-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {completedAgents.length > 0 && (
              <div className="p-2 bg-green-50 border border-green-100 rounded-md">
                <h4 className="text-xs font-medium text-green-700 mb-1 flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
                </h4>
                {completedAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center text-sm py-1">
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {pendingAgents.length > 0 && (
              <div className="p-2 bg-muted/30 border border-muted/40 rounded-md">
                <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                </h4>
                {pendingAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center text-sm py-1 text-muted-foreground">
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {errorAgents.length > 0 && (
              <div className="p-2 bg-red-50 border border-red-100 rounded-md">
                <h4 className="text-xs font-medium text-red-700 mb-1 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> Errors
                </h4>
                {errorAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center text-sm py-1">
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentStatusVisualizer;
