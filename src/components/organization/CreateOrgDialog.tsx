
import { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, FileText, Check, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Organization } from "@/utils/organizations";
import { PlanCard } from "./PlanCard";
import { PaymentForm } from "./PaymentForm";
import { BillingInfo } from "@/utils/payment";

// Step 1: Basic organization info
const basicInfoSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  industry: z.string().min(1, {
    message: "Please select an industry.",
  }),
  companySize: z.string().min(1, {
    message: "Please select company size.",
  }),
  contactEmail: z.string().email({
    message: "Please provide a valid email address.",
  }),
  description: z.string().optional(),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

// Step 2: Plan selection is handled separately

// Step 3: Billing info
const billingInfoSchema = z.object({
  billingName: z.string().min(2, {
    message: "Billing name is required.",
  }),
  billingEmail: z.string().email({
    message: "Please provide a valid email address.",
  }),
  address: z.string().min(5, {
    message: "Please provide a valid address.",
  }),
  city: z.string().min(2, {
    message: "City is required.",
  }),
  state: z.string().min(2, {
    message: "State/Province is required.",
  }),
  postalCode: z.string().min(3, {
    message: "Postal/ZIP code is required.",
  }),
  country: z.string().min(2, {
    message: "Country is required.",
  }),
  vatId: z.string().optional(),
});

type BillingInfoValues = z.infer<typeof billingInfoSchema>;

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrg: (organization: Omit<Organization, "id" | "createdAt" | "usageStats">) => void;
}

type OnboardingStep = 'basic-info' | 'select-plan' | 'billing-info' | 'payment';

export function CreateOrgDialog({ open, onOpenChange, onCreateOrg }: CreateOrgDialogProps) {
  const [step, setStep] = useState<OnboardingStep>('basic-info');
  const [basicInfo, setBasicInfo] = useState<BasicInfoValues | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("Starter");
  const [billingInfo, setBillingInfo] = useState<BillingInfoValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const basicForm = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      industry: "",
      companySize: "",
      contactEmail: "",
      description: "",
    },
  });

  const billingForm = useForm<BillingInfoValues>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: {
      billingName: "",
      billingEmail: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      vatId: "",
    },
  });

  const handleCloseDialog = () => {
    // Reset forms and state when closing the dialog
    basicForm.reset();
    billingForm.reset();
    setBasicInfo(null);
    setSelectedPlan("Starter");
    setBillingInfo(null);
    setStep('basic-info');
    onOpenChange(false);
  };

  const onBasicInfoSubmit = (values: BasicInfoValues) => {
    setBasicInfo(values);
    setStep('select-plan');
  };

  const onPlanSelected = (plan: string) => {
    setSelectedPlan(plan);
    setStep('billing-info');
  };

  const onBillingInfoSubmit = (values: BillingInfoValues) => {
    setBillingInfo(values);
    
    // If the selected plan is Starter (free), skip payment step
    if (selectedPlan === "Starter") {
      handleCreateOrganization();
    } else {
      setStep('payment');
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    handleCreateOrganization();
  };

  const handleCreateOrganization = () => {
    if (!basicInfo) return;
    
    setIsSubmitting(true);
    
    // Create organization with all collected data
    const newOrg = {
      name: basicInfo.name,
      plan: selectedPlan as "Starter" | "Professional" | "Enterprise",
      industry: basicInfo.industry,
      companySize: basicInfo.companySize,
      contactEmail: basicInfo.contactEmail,
      billingAddress: billingInfo ? 
        `${billingInfo.address}, ${billingInfo.city}, ${billingInfo.state} ${billingInfo.postalCode}, ${billingInfo.country}` : 
        undefined,
      paymentStatus: selectedPlan === "Starter" ? "active" : "active",
    };
    
    // Simulate API delay
    setTimeout(() => {
      onCreateOrg(newOrg);
      toast.success("Organization created successfully", {
        description: `${newOrg.name} has been set up with the ${newOrg.plan} plan.`,
      });
      handleCloseDialog();
      setIsSubmitting(false);
    }, 1000);
  };

  // Determine if the current step can proceed
  const canProceed = () => {
    switch (step) {
      case 'basic-info':
        return basicForm.formState.isValid;
      case 'select-plan':
        return !!selectedPlan;
      case 'billing-info':
        return billingForm.formState.isValid;
      case 'payment':
        return true; // Payment form handles its own validation
    }
  };

  // Helper to transform billing info into the format needed for payment
  const getBillingInfoForPayment = (): BillingInfo => {
    if (!billingInfo) {
      return {
        name: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      };
    }
    
    return {
      name: billingInfo.billingName,
      email: billingInfo.billingEmail,
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      postalCode: billingInfo.postalCode,
      country: billingInfo.country,
      vatId: billingInfo.vatId,
    };
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="flex justify-between mb-6">
          <StepIndicator 
            step={1} 
            label="Basic Info" 
            active={step === 'basic-info'} 
            completed={!!basicInfo} 
          />
          <StepConnector completed={!!basicInfo} />
          <StepIndicator 
            step={2} 
            label="Select Plan" 
            active={step === 'select-plan'} 
            completed={step === 'billing-info' || step === 'payment'} 
          />
          <StepConnector completed={step === 'billing-info' || step === 'payment'} />
          <StepIndicator 
            step={3} 
            label="Billing Info" 
            active={step === 'billing-info'} 
            completed={step === 'payment'} 
          />
          <StepConnector completed={step === 'payment'} />
          <StepIndicator 
            step={4} 
            label="Payment" 
            active={step === 'payment'} 
            completed={false} 
          />
        </div>
        
        {step === 'basic-info' && (
          <Form {...basicForm}>
            <form onSubmit={basicForm.handleSubmit(onBasicInfoSubmit)} className="space-y-4">
              <FormField
                control={basicForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={basicForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicForm.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-50">1-50 employees</SelectItem>
                          <SelectItem value="51-100">51-100 employees</SelectItem>
                          <SelectItem value="101-500">101-500 employees</SelectItem>
                          <SelectItem value="501-1000">501-1000 employees</SelectItem>
                          <SelectItem value="1001+">1001+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={basicForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={basicForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of your organization" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full mt-2"
                  disabled={!canProceed()}
                >
                  Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        
        {step === 'select-plan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlanCard 
                planName="Starter" 
                isSelected={selectedPlan === "Starter"} 
                onSelect={() => setSelectedPlan("Starter")} 
              />
              <PlanCard 
                planName="Professional" 
                isSelected={selectedPlan === "Professional"} 
                onSelect={() => setSelectedPlan("Professional")} 
              />
              <PlanCard 
                planName="Enterprise" 
                isSelected={selectedPlan === "Enterprise"} 
                onSelect={() => setSelectedPlan("Enterprise")} 
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('basic-info')}
              >
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => onPlanSelected(selectedPlan)}
              >
                Continue with {selectedPlan}
              </Button>
            </DialogFooter>
          </div>
        )}
        
        {step === 'billing-info' && (
          <Form {...billingForm}>
            <form onSubmit={billingForm.handleSubmit(onBillingInfoSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={billingForm.control}
                  name="billingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={billingForm.control}
                  name="billingEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="billing@organization.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={billingForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Suite 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={billingForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={billingForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="California" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={billingForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="94107" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={billingForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={billingForm.control}
                name="vatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT/Tax ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="VAT12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('select-plan')}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={!canProceed()}
                >
                  {selectedPlan === "Starter" ? "Complete Setup" : "Continue to Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        
        {step === 'payment' && (
          <div className="space-y-6">
            <PaymentForm 
              planName={selectedPlan} 
              onSuccess={handlePaymentSuccess} 
              onCancel={() => setStep('billing-info')}
              billingInfo={getBillingInfoForPayment()}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center border
          ${active ? 'bg-primary text-primary-foreground border-primary' : 
            completed ? 'bg-primary/20 text-primary border-primary' : 
            'bg-muted text-muted-foreground border-muted-foreground'}`}
      >
        {completed ? <Check className="h-4 w-4" /> : step}
      </div>
      <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div 
        className={`h-0.5 w-full ${completed ? 'bg-primary' : 'bg-muted'}`}
      />
    </div>
  );
}
