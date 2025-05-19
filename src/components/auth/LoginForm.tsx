
import { useState } from 'react';
import { useAuth } from './UserAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Lock, Mail } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="flex min-h-screen bg-[#101322] dark:bg-[#0f1118]">
      {/* Left Panel (60%) - Hero Section */}
      <div className="hidden md:flex md:w-[60%] flex-col justify-center p-8 lg:p-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1D2E] to-[#101322] opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554774853-b415df9eeb92?auto=format&fit=crop&w=800')] bg-cover opacity-[0.06]"></div>
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-purple-900/10 animate-pulse-light"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center mb-10">
            <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="Z-Transact logo" className="h-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gradient">
            Z-Transact AI Assistant
          </h1>
          
          <h2 className="text-xl md:text-2xl mb-8 text-blue-200 font-light">
            Built to Think Like an Auditor. Designed to Move Like an Analyst.
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <p className="text-lg">
              Z-Transact is more than a tool — it's your intelligent financial co-pilot. 
              Designed to operate like a junior auditor, it automates complex accounting 
              workflows with the precision of a compliance officer and the intuition of a 
              seasoned analyst.
            </p>
            
            <p className="text-lg">
              From invoice matching to real-time payment tracking, Z-Transact seamlessly 
              integrates with your financial data, client records, and workflow systems. 
              It understands context, flags anomalies, answers queries, and drives 
              decisions — all in real time.
            </p>
            
            <p className="text-lg">
              By harnessing the power of multiple specialized agents, Z-Transact transforms 
              static finance operations into dynamic, self-optimizing systems. Reduce human 
              error. Improve turnaround. Free your team for what matters most.
            </p>
          </div>
          
          {/* Z avatar/mascot */}
          <div className="mt-12 flex items-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
            <div className="ml-4">
              <p className="text-blue-200 text-sm font-medium">Let Z-Transact handle the repetitive,</p>
              <p className="text-white font-semibold">so you can focus on the strategic.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel (40%) - Login Form */}
      <div className="w-full md:w-[40%] flex items-center justify-center px-6 py-12 bg-[#0e111b]/60">
        <Card className="w-full max-w-md shadow-xl border-[#2a3149] bg-[#151929]">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-center items-center mb-4">
              <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="Z-Transact logo" className="h-10 md:hidden" />
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-glow">
                <span className="text-white text-3xl font-bold">Z</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">Sign in to Z-Transact</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Access your AI-powered financial assistant
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="email" 
                    placeholder="finance@example.com" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10 bg-[#1c2136] border-[#2a3149] text-white focus:ring-blue-600 focus:border-blue-600" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <a href="#" className="text-sm text-blue-500 hover:text-blue-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-10 bg-[#1c2136] border-[#2a3149] text-white focus:ring-blue-600 focus:border-blue-600" 
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="text-center text-sm text-gray-400">
                Don't have an account? <a href="#" className="text-blue-500 hover:text-blue-400 hover:underline">Sign up</a>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-[#2a3149]">
              <div className="rounded-md bg-[#1c2136] p-4 flex">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                <div className="text-sm text-gray-300">
                  <strong className="text-white">Demo accounts:</strong><br />
                  finance@example.com | 123456<br />
                  manager@example.com | 123456<br />
                  auditor@example.com | 123456
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center pt-0 text-gray-500">
            <p className="text-xs">
              Copyright © 2025 yavar Techworks Pte Ltd., All rights reserved
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
