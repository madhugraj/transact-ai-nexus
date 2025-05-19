import { useState } from 'react';
import { useAuth } from './UserAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Lock, Mail, CheckCircle } from 'lucide-react';
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    login
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (!success) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back",
          description: "You've successfully logged in"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const featureItems = ["Invoice Processing with Smart Matching", "Real-time Payment Tracking & Alerts", "Task Automation & Workflow Management", "Financial Data Analysis & Reporting", "Client Query Resolution in Seconds", "Personalized Recommendations for Clients", "Compliance Monitoring & Anomaly Detection"];
  return <div className="flex min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-[#1a1a2e] dark:to-[#16213e]">
      {/* Left Panel (60%) */}
      <div className="hidden md:flex md:w-[60%] bg-gradient-to-br from-[#f0f6ff]/20 to-[#e6f0ff]/30 p-8 lg:p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554774853-b415df9eeb92?auto=format&fit=crop&w=800')] bg-cover opacity-[0.03]"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center mb-8 gap-4">
            <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="yavar logo" className="h-12" />
            
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Welcome to Z-Transact
          </h1>
          <h2 className="text-xl md:text-2xl text-primary/80 mb-8">
            AI-Powered Audit Assistant
          </h2>
          
          <p className="text-lg mb-8 text-muted-foreground">
            Streamline your financial workflows with intelligent automation:
          </p>
          
          <ul className="space-y-4">
            {featureItems.map((feature, index) => <li key={index} className="flex items-start gap-3 group">
                <span className="mt-0.5 text-primary group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  {feature}
                </span>
              </li>)}
          </ul>
          
          <p className="mt-12 text-muted-foreground font-medium">
            Let Z-Transact handle the repetitive, so you can focus on the strategic.
          </p>
        </div>
        
        {/* Avatar/Mascot */}
        
      </div>
      
      {/* Right Panel (40%) - Login Form */}
      <div className="w-full md:w-[40%] flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md shadow-lg bg-white border border-gray-200">
          <CardHeader className="space-y-1">
            <div className="flex justify-center items-center gap-2 mb-2">
              <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="yavar logo" className="h-8 md:hidden" />
              <div className="h-12 w-12 rounded-full yavar-gradient flex items-center justify-center">
                <span className="text-white text-xl font-bold">Z</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign in to Z-Transact</CardTitle>
            <CardDescription className="text-center">
              Access your AI-powered financial assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" placeholder="finance@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full yavar-gradient hover:opacity-90 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="rounded-md bg-blue-50 p-4 flex">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                <div className="text-sm text-blue-800">
                  <strong>Demo accounts:</strong><br />
                  finance@example.com | 123456<br />
                  manager@example.com | 123456<br />
                  auditor@example.com | 123456
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              Copyright © 2025 yavar Techworks Pte Ltd., All rights reserved
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>;
};
export default LoginForm;