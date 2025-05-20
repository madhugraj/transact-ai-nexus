
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, RefreshCw, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { AgentDataPreviewModal } from "./AgentDataPreviewModal";
import { FieldMappingConfigurator } from "./FieldMappingConfigurator";

interface Module {
  name: string;
  lastSynced: string;
  recordsFetched: number;
}

interface DataSource {
  name: string;
  type: "CRM" | "Accounting" | "Financial" | "Compliance";
  status: "connected" | "disconnected" | "error";
  modules: Module[];
}

interface AgentDataSourcePanelProps {
  sources: DataSource[];
  agentType: "recommendations" | "financial" | "automation" | "compliance";
  onRefresh?: () => Promise<void>;
}

export function AgentDataSourcePanel({ 
  sources, 
  agentType, 
  onRefresh 
}: AgentDataSourcePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh data sources
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing data sources:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };
  
  // Open data preview modal
  const handleOpenPreview = (source: DataSource) => {
    setSelectedSource(source);
    setIsPreviewOpen(true);
  };
  
  // Open field mapping modal
  const handleOpenMapping = (source: DataSource) => {
    setSelectedSource(source);
    setIsMappingOpen(true);
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "disconnected":
        return "bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
      case "error":
        return "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };
  
  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-transparent p-1">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CollapsibleTrigger>
            <h3 className="text-sm font-medium">Data Source Overview</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Syncing..." : "Refresh Sync"}
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
          <Card className="bg-card border border-border">
            <CardContent className="p-4 space-y-4">
              {sources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{source.type}:</span>
                      <span>{source.name}</span>
                      <Badge variant="outline" className={getStatusBadge(source.status)}>
                        {source.status === "connected" ? "✓ Connected" : 
                         source.status === "error" ? "⚠ Error" : "⨯ Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenPreview(source)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Raw Data
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenMapping(source)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure Mapping
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pl-4 text-sm space-y-1 text-muted-foreground">
                    {source.modules.map((module, mIndex) => (
                      <div key={mIndex} className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span>↳ {source.type === "CRM" ? "Modules" : "Tables"} Used:</span>
                          <span className="font-medium">{module.name}</span>
                        </div>
                        <div className="pl-4 text-xs">
                          Last Synced: {module.lastSynced} | Records Fetched: {module.recordsFetched}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Data Preview Modal */}
      <AgentDataPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        source={selectedSource}
        agentType={agentType}
      />
      
      {/* Field Mapping Modal */}
      <FieldMappingConfigurator 
        isOpen={isMappingOpen} 
        onClose={() => setIsMappingOpen(false)} 
        source={selectedSource}
        agentType={agentType}
      />
    </>
  );
}
