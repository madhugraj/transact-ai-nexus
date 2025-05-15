import { Agent } from "./types";
import { DataInputAgent } from "./DataInputAgent";
import { OCRExtractionAgent } from "./OCRExtractionAgent";
import { PDFTableExtractionAgent } from "./PDFTableExtractionAgent";
import { DynamicTableDetectionAgent } from "./DynamicTableDetectionAgent";
import { DisplayAgent } from "./DisplayAgent";

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Record<string, Agent> = {};

  private constructor() {
    // Register available agents
    this.registerAgent(new DataInputAgent());
    this.registerAgent(new OCRExtractionAgent());
    this.registerAgent(new PDFTableExtractionAgent());
    this.registerAgent(new DynamicTableDetectionAgent());
    this.registerAgent(new DisplayAgent());
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
