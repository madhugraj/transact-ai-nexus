
export interface Agent {
  id: string;
  name: string;
  description: string;
  process: (data: any, context?: any) => Promise<any>;
  canProcess: (data: any) => boolean;
}

export interface AgentNode {
  agent: Agent;
  nextAgents: string[];
}

export interface AgentGraph {
  nodes: Map<string, AgentNode>;
  addNode: (id: string, agent: Agent) => void;
  connect: (fromId: string, toId: string) => void;
  process: (inputData: any, startAgentId: string) => Promise<any>;
}

export interface ProcessingContext {
  processingId?: string;
  options?: any;
  files?: any[];
  results?: Map<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    agentId: string;
    processingTime: number;
    nextAgent?: string;
  };
}
