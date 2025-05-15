
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-4xl font-bold mb-6">Document AI Platform</h1>
      <p className="text-xl text-center text-gray-600 mb-8 max-w-2xl">
        Upload, process, and analyze your documents with our AI-powered platform.
        Extract data from various document formats and get actionable insights.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="px-8">
          <Link to="/assistant">AI Assistant</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="px-8">
          <Link to="/documents">Upload Documents</Link>
        </Button>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          title="Document Processing" 
          description="Upload and process various document formats including PDFs, images, and spreadsheets."
          icon="📄"
        />
        <FeatureCard 
          title="AI Analysis" 
          description="Let our AI extract insights and analyze your documents intelligently."
          icon="🤖"
        />
        <FeatureCard 
          title="Data Integration" 
          description="Connect processed data with your existing databases and systems."
          icon="🔄"
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Index;
