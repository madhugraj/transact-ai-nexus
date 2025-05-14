
import { AgentCoordinator } from "./AgentCoordinator";
import { DataInputAgent } from "./DataInputAgent";
import { OCRExtractionAgent } from "./OCRExtractionAgent";
import { PDFTableExtractionAgent } from "./PDFTableExtractionAgent";
import { DynamicTableDetectionAgent } from "./DynamicTableDetectionAgent";
import { DisplayAgent } from "./DisplayAgent";

// Create and configure the agent graph
export function createAgentGraph() {
  const graph = new AgentCoordinator();
  
  // Add all agents to the graph
  graph.addNode("DataInput", new DataInputAgent());
  graph.addNode("OCRExtraction", new OCRExtractionAgent());
  graph.addNode("PDFTableExtraction", new PDFTableExtractionAgent());
  graph.addNode("DynamicTableDetection", new DynamicTableDetectionAgent());
  graph.addNode("DisplayAgent", new DisplayAgent());
  
  // Connect agents to form the processing pipeline
  graph.connect("DataInput", "OCRExtraction");
  graph.connect("OCRExtraction", "PDFTableExtraction");
  graph.connect("PDFTableExtraction", "DynamicTableDetection");
  graph.connect("DynamicTableDetection", "DisplayAgent");
  
  return graph;
}

// Singleton instance of the agent graph
let agentGraph: AgentCoordinator | null = null;

// Get or create the agent graph
export function getAgentGraph() {
  if (!agentGraph) {
    agentGraph = createAgentGraph();
  }
  return agentGraph;
}
