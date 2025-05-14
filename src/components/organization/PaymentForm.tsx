
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { processPayment, PaymentDetails, BillingInfo, PaymentMethod } from "@/utils/payment";
import { planFeatures } from "@/utils/planFeatures";

interface PaymentFormProps {
  planName: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
  billingInfo: BillingInfo;
}

const paymentFormSchema = z.object({
  paymentMethod: z.enum(["credit_card", "bank_transfer", "paypal"]),
  // Card details schema
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  // Bank details schema
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  // PayPal schema
  paypalEmail: z.string().email().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function PaymentForm({ planName, onSuccess, onCancel, billingInfo }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const planPrice = planFeatures[planName]?.price || 0;
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "credit_card",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvc: "",
    },
  });
  
  const { watch } = form;
  const paymentMethod = watch("paymentMethod") as PaymentMethod;

  async function onSubmit(values: PaymentFormValues) {
    setIsSubmitting(true);
    
    // Prepare payment details based on the selected method
    const paymentDetails: PaymentDetails = {
      method: values.paymentMethod as PaymentMethod,
    };
    
    if (values.paymentMethod === "credit_card") {
      paymentDetails.cardDetails = {
        number: values.cardNumber || "",
        name: values.cardName || "",
        expiry: values.cardExpiry || "",
        cvc: values.cardCvc || "",
      };
    } else if (values.paymentMethod === "bank_transfer") {
      paymentDetails.bankDetails = {
        accountName: values.bankAccountName || "",
        accountNumber: values.bankAccountNumber || "",
        routingNumber: values.bankRoutingNumber || "",
      };
    } else if (values.paymentMethod === "paypal") {
      paymentDetails.paypalEmail = values.paypalEmail;
    }
    
    try {
      const result = await processPayment(
        planName,
        planPrice,
        paymentDetails,
        billingInfo
      );
      
      if (result.success && result.transactionId) {
        onSuccess(result.transactionId);
      } else {
        throw new Error(result.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      // In a real app, you would handle this error and show a message to the user
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Payment Method</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you'd like to pay for your {planName} plan
          </p>
          
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer data-[state=checked]:border-primary">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                        Credit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer data-[state=checked]:border-primary">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                        Bank Transfer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer data-[state=checked]:border-primary">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        PayPal
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        {/* Conditional form fields based on payment method */}
        {paymentMethod === "credit_card" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="4242 4242 4242 4242" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name on Card</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cardExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cardCvc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {paymentMethod === "bank_transfer" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bankAccountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="000123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankRoutingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Routing Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {paymentMethod === "paypal" && (
          <FormField
            control={form.control}
            name="paypalEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PayPal Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your-email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <span>Plan Price:</span>
            <span className="font-semibold">${planPrice}</span>
          </div>
          {planPrice > 0 && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span>Tax:</span>
                <span>${(planPrice * 0.1).toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${(planPrice * 1.1).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-2 justify-end pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay Now
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
