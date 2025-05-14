
import { toast } from "sonner";

export type PaymentMethod = "credit_card" | "bank_transfer" | "paypal";

export interface PaymentDetails {
  method: PaymentMethod;
  cardDetails?: {
    number: string;
    name: string;
    expiry: string;
    cvc: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    routingNumber: string;
  };
  paypalEmail?: string;
}

export interface BillingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  vatId?: string;
}

// This is a mock function to simulate payment processing
// In a real app, this would interface with a payment gateway API
export const processPayment = (
  planName: string,
  amount: number,
  paymentDetails: PaymentDetails,
  billingInfo: BillingInfo
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  return new Promise((resolve) => {
    // Simulate API call with timeout
    setTimeout(() => {
      // For demo purposes, let's consider all payments successful
      // In a real app, validate payment details and handle errors
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      toast.success("Payment processed successfully", {
        description: `Your payment for the ${planName} plan has been processed. Transaction ID: ${transactionId}`,
        duration: 5000,
      });
      
      resolve({
        success: true,
        transactionId
      });
      
      // Example of how you might handle errors:
      // if (paymentDetails.cardDetails?.number === '4000000000000002') {
      //   resolve({
      //     success: false,
      //     error: 'Card declined. Please try a different payment method.'
      //   });
      // }
    }, 1500); // Simulate a delay for the payment processing
  });
};
