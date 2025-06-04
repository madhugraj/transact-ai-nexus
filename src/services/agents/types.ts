
/**
 * Interface for processing context passed between agents
 */
export interface ProcessingContext {
  options?: Record<string, any>;
  results?: Map<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Agent processing result interface
 */
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  agent: string;
  metadata?: Record<string, any>;
}

/**
 * Interface that all agents must implement
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  
  /**
   * Process data with this agent
   */
  process(data: any, context?: ProcessingContext): Promise<AgentResult>;
  
  /**
   * Determine if this agent can process the given data
   */
  canProcess(data: any): boolean;
}

/**
 * Node in the agent processing graph
 */
export interface AgentNode {
  agent: Agent;
  nextAgents: string[];
}

/**
 * Agent processing result interface
 */
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

/**
 * Agent graph interface
 */
export interface AgentGraph {
  nodes: Map<string, AgentNode>;
  
  addNode(id: string, agent: Agent): void;
  connect(fromId: string, toId: string): void;
  process(inputData: any, startAgentId: string, context?: ProcessingContext): Promise<ProcessingResult>;
  getAvailableAgents(): Agent[];
}
