
// Define feature limits and capabilities for each plan
export interface PlanFeatures {
  maxUsers: number;
  maxDocuments: number;
  maxStorage: number; // in GB
  aiAssistant: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  price: number; // monthly price in dollars
}

// Plan feature matrix
export const planFeatures: Record<string, PlanFeatures> = {
  "Starter": {
    maxUsers: 5,
    maxDocuments: 100,
    maxStorage: 5,
    aiAssistant: false,
    advancedAnalytics: false,
    prioritySupport: false,
    customIntegrations: false,
    price: 0,
  },
  "Professional": {
    maxUsers: 20,
    maxDocuments: 1000,
    maxStorage: 50,
    aiAssistant: true,
    advancedAnalytics: true,
    prioritySupport: false,
    customIntegrations: false,
    price: 49,
  },
  "Enterprise": {
    maxUsers: 100,
    maxDocuments: 10000,
    maxStorage: 500,
    aiAssistant: true,
    advancedAnalytics: true,
    prioritySupport: true,
    customIntegrations: true,
    price: 199,
  }
};

// Utility function to check if a feature is available for a given plan
export function hasFeatureAccess(plan: string, feature: keyof PlanFeatures): boolean {
  if (!planFeatures[plan]) return false;
  
  const value = planFeatures[plan][feature];
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For numeric values, if they exist (are > 0), the feature is available
  return (typeof value === 'number' && value > 0);
}

// Get the usage percentage for a numeric limit
export function getUsagePercentage(plan: string, feature: 'maxUsers' | 'maxDocuments' | 'maxStorage', currentUsage: number): number {
  if (!planFeatures[plan] || typeof planFeatures[plan][feature] !== 'number') return 100;
  
  const limit = planFeatures[plan][feature] as number;
  return (currentUsage / limit) * 100;
}
