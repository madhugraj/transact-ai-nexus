
import AIAssistant from "@/components/assistant/AIAssistant";
import AppLayout from "@/components/layout/AppLayout";
import AIWorkflowIntegration from "@/components/assistant/AIWorkflowIntegration";

const Assistant = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-2">AI Assistant</h1>
        <AIWorkflowIntegration />
        <AIAssistant />
      </div>
    </AppLayout>
  );
};

export default Assistant;
