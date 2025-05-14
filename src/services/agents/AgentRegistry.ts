
import { DataInputAgent } from './DataInputAgent';
import { OCRExtractionAgent } from './OCRExtractionAgent';
import { PDFTableExtractionAgent } from './PDFTableExtractionAgent';
import { DynamicTableDetectionAgent } from './DynamicTableDetectionAgent';
import { DisplayAgent } from './DisplayAgent';
import { Agent, ProcessingContext } from './types';
import { ApiResponse } from '../api/types';

// Initialize all agents
const dataInputAgent = new DataInputAgent();
const ocrExtractionAgent = new OCRExtractionAgent();
const pdfTableExtractionAgent = new PDFTableExtractionAgent();
const dynamicTableDetectionAgent = new DynamicTableDetectionAgent();
const displayAgent = new DisplayAgent();

// Agent processing graph for document processing
class AgentProcessingGraph {
  private agents: Map<string, Agent>;
  
  constructor() {
    this.agents = new Map();
    this.registerAgent(dataInputAgent);
    this.registerAgent(ocrExtractionAgent);
    this.registerAgent(pdfTableExtractionAgent);
    this.registerAgent(dynamicTableDetectionAgent);
    this.registerAgent(displayAgent);
  }
  
  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }
  
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
  
  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  async process(
    input: any,
    startAgentId: string = 'DataInput',
    context?: ProcessingContext
  ): Promise<ApiResponse<any>> {
    console.log(`Starting agent processing with agent: ${startAgentId}`);
    
    try {
      const startAgent = this.getAgent(startAgentId);
      
      if (!startAgent) {
        console.error(`Agent with ID ${startAgentId} not found`);
        return {
          success: false,
          error: `Agent with ID ${startAgentId} not found`
        };
      }
      
      // First agent processes the input
      console.log(`Running first agent: ${startAgent.id}`);
      let data = await startAgent.process(input, context);
      
      // Get remaining agents from the processing pipeline
      const remainingAgents = this.getProcessingPipeline(startAgent.id);
      
      // Run each agent in sequence
      for (const agentId of remainingAgents) {
        const agent = this.getAgent(agentId);
        
        if (!agent) {
          console.warn(`Agent with ID ${agentId} not found, skipping`);
          continue;
        }
        
        console.log(`Checking if agent ${agent.id} can process data...`);
        
        // Check if agent can process the current data state
        if (agent.canProcess(data)) {
          console.log(`Running agent: ${agent.id}`);
          // Process and update data
          data = await agent.process(data, context);
          console.log(`Agent ${agent.id} completed processing, keys: ${Object.keys(data).join(', ')}`);
          
          // Special logging for tables
          if (data.tableData) {
            console.log(`Table data after ${agent.id}:`, {
              headers: data.tableData.headers,
              rowCount: data.tableData.rows.length
            });
          }
          if (data.extractedTables) {
            console.log(`Extracted tables after ${agent.id}:`, {
              count: data.extractedTables.length,
              firstTable: data.extractedTables.length > 0 ? {
                headers: data.extractedTables[0].headers,
                rowCount: data.extractedTables[0].rows.length
              } : 'none'
            });
          }
        } else {
          console.log(`Agent ${agent.id} cannot process current data, skipping`);
        }
      }
      
      console.log("Agent processing completed successfully");
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("Error during agent processing:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during agent processing"
      };
    }
  }
  
  private getProcessingPipeline(startAgentId: string): string[] {
    // Define processing pipeline based on starting agent
    const pipelines: Record<string, string[]> = {
      'DataInput': ['OCRExtraction', 'PDFTableExtraction', 'DynamicTableDetection', 'DisplayAgent'],
      'OCRExtraction': ['PDFTableExtraction', 'DynamicTableDetection', 'DisplayAgent'],
      'PDFTableExtraction': ['DynamicTableDetection', 'DisplayAgent'],
      'DynamicTableDetection': ['DisplayAgent']
    };
    
    return pipelines[startAgentId] || [];
  }
}

// Singleton instance of agent graph
let agentGraph: AgentProcessingGraph | null = null;

// Get or create agent graph
export function getAgentGraph(): AgentProcessingGraph {
  if (!agentGraph) {
    agentGraph = new AgentProcessingGraph();
  }
  return agentGraph;
}
