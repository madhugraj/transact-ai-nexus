
import { Agent, AgentGraph, AgentNode, ProcessingContext, ProcessingResult } from "./types";
import { toast } from "@/hooks/use-toast";

export class AgentCoordinator implements AgentGraph {
  nodes: Map<string, AgentNode> = new Map();
  
  addNode(id: string, agent: Agent): void {
    if (this.nodes.has(id)) {
      throw new Error(`Agent with id ${id} already exists in the graph`);
    }
    
    const agentWithId = {
      ...agent,
      id
    };
    
    this.nodes.set(id, {
      agent: agentWithId,
      nextAgents: []
    });
  }
  
  connect(fromId: string, toId: string): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (!fromNode || !toNode) {
      throw new Error(`Cannot connect: one or both nodes do not exist: ${fromId} -> ${toId}`);
    }
    
    if (!fromNode.nextAgents.includes(toId)) {
      fromNode.nextAgents.push(toId);
    }
  }
  
  async process(inputData: any, startAgentId: string, context: ProcessingContext = {}): Promise<ProcessingResult> {
    const node = this.nodes.get(startAgentId);
    
    if (!node) {
      return {
        success: false,
        error: `Agent with id ${startAgentId} not found`
      };
    }
    
    if (!context.results) {
      context.results = new Map();
    }
    
    try {
      console.log(`🤖 ${node.agent.name} agent starting...`);
      const startTime = performance.now();
      
      // Process data with current agent
      const result = await node.agent.process(inputData, context);
      const processingTime = performance.now() - startTime;
      
      console.log(`✅ ${node.agent.name} completed in ${processingTime.toFixed(2)}ms`);
      
      // Store result in context
      context.results.set(startAgentId, result);
      
      // Find next agent to process
      let nextAgentId: string | undefined;
      
      if (node.nextAgents.length > 0) {
        // Find the first agent that can process this data
        for (const candidateId of node.nextAgents) {
          const candidateNode = this.nodes.get(candidateId);
          if (candidateNode && candidateNode.agent.canProcess(result)) {
            nextAgentId = candidateId;
            break;
          }
        }
      }
      
      const processedResult: ProcessingResult = {
        success: true,
        data: result,
        metadata: {
          agentId: startAgentId,
          processingTime,
          nextAgent: nextAgentId
        }
      };
      
      // If there's a next agent, continue the chain
      if (nextAgentId) {
        return this.process(result, nextAgentId, context);
      }
      
      return processedResult;
    } catch (error) {
      console.error(`Agent ${node.agent.name} error:`, error);
      
      toast({
        title: `${node.agent.name} Error`,
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          agentId: startAgentId,
          processingTime: 0
        }
      };
    }
  }
  
  getAvailableAgents(): Agent[] {
    return Array.from(this.nodes.values()).map(node => node.agent);
  }
}
