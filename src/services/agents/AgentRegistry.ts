import { Agent } from "./types";
import { DataInputAgent } from "./DataInputAgent";
import { OCRExtractionAgent } from "./OCRExtractionAgent";
import { PDFTableExtractionAgent } from "./PDFTableExtractionAgent";
import { DynamicTableDetectionAgent } from "./DynamicTableDetectionAgent";
import { DisplayAgent } from "./DisplayAgent";
import { ImageTableExtractionAgent } from "./ImageTableExtractionAgent";
import { AgentCoordinator } from "./AgentCoordinator";
import { InvoiceDetectionAgent } from './InvoiceDetectionAgent';
import { InvoiceDataExtractionAgent } from './InvoiceDataExtractionAgent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Record<string, Agent> = {};

  private constructor() {
    // Register available agents
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Register existing agents
    this.registerAgent(new DataInputAgent());
    this.registerAgent(new OCRExtractionAgent());
    this.registerAgent(new PDFTableExtractionAgent());
    this.registerAgent(new ImageTableExtractionAgent()); // Add the new agent
    this.registerAgent(new DynamicTableDetectionAgent());
    this.registerAgent(new DisplayAgent());

    // Register new invoice processing agents
    this.registerAgent(new InvoiceDetectionAgent());
    this.registerAgent(new InvoiceDataExtractionAgent());
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public registerAgent(agent: Agent): void {
    this.agents[agent.id] = agent;
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agents[agentId];
  }

  public getAgents(): Agent[] {
    return Object.values(this.agents);
  }
}

// Export a function to create and configure the agent graph
export function getAgentGraph(): AgentCoordinator {
  const coordinator = new AgentCoordinator();
  
  // Add all agents from the registry
  const registry = AgentRegistry.getInstance();
  const agents = registry.getAgents();
  
  // Add all agents to the graph
  agents.forEach(agent => {
    coordinator.addNode(agent.id, agent);
  });
  
  // Configure the processing pipeline
  coordinator.connect("DataInput", "OCRExtraction");
  coordinator.connect("OCRExtraction", "PDFTableExtraction");
  coordinator.connect("OCRExtraction", "ImageTableExtraction"); // Connect to the new image agent
  coordinator.connect("PDFTableExtraction", "DynamicTableDetection");
  coordinator.connect("ImageTableExtraction", "DynamicTableDetection"); // Add path from ImageTableExtraction
  coordinator.connect("DynamicTableDetection", "DisplayAgent");
  
  return coordinator;
}
