
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Sparkles, LineChart, AlertTriangle, PieChart } from 'lucide-react';

interface GeminiInsightsPanelProps {
  insights: any;
  processingId?: string;
}

const GeminiInsightsPanel: React.FC<GeminiInsightsPanelProps> = ({
  insights,
  processingId
}) => {
  if (!insights) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          Gemini AI Insights
          <Badge variant="outline" className="ml-2 bg-blue-50/50 text-blue-600">
            AI Generated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Section */}
          <div>
            <h3 className="text-sm font-medium flex items-center mb-2">
              <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
              Summary
            </h3>
            <p className="text-sm text-muted-foreground">
              {insights.summary || "No summary available"}
            </p>
          </div>
          
          <Separator />
          
          {/* Patterns/Trends Section */}
          {insights.patterns && insights.patterns.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <LineChart className="h-4 w-4 mr-1 text-blue-500" />
                Key Patterns & Trends
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {insights.patterns.map((pattern: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">{pattern}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Anomalies Section */}
          {insights.anomalies && insights.anomalies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Anomalies & Outliers
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {insights.anomalies.map((anomaly: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">{anomaly}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Visualization Suggestions */}
          {insights.visualizationSuggestions && insights.visualizationSuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <PieChart className="h-4 w-4 mr-1 text-green-500" />
                Recommended Visualizations
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {insights.visualizationSuggestions.map((viz: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground">{viz}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Processing Metadata */}
          <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Processing ID: {processingId || "Unknown"}</span>
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiInsightsPanel;
