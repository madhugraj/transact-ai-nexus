
import { useState, useEffect } from 'react';
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
  const [isAnimated, setIsAnimated] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
    <div className="flex min-h-screen bg-[#101322] overflow-hidden">
      {/* Left Panel (60%) - Hero Section with logo and minimalist content */}
      <div 
        className={`hidden md:flex md:w-[60%] flex-col justify-center items-start p-8 lg:p-16 xl:p-24 text-white relative transition-all duration-1000 ease-out ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1D2E] to-[#101322] opacity-95"></div>
        
        {/* Simplified backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-purple-900/10 animate-flow"></div>
        
        <div className="relative z-10 max-w-2xl">
          {/* Logo section - smaller size */}
          <div className="flex items-center mb-16">
            <img 
              src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" 
              alt="Z-Transact logo" 
              className="h-16 w-auto" 
            />
          </div>
          
          {/* Updated title - removed "AI Assistant" */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-gradient">
            Z-Transact
          </h1>
          
          <h2 className="text-xl md:text-2xl mb-8 text-blue-200 font-light">
            Built to Think Like an Auditor
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <p className="text-lg">
              Intelligent automation for finance and audit operations.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel (40%) - Login Form with animations */}
      <div 
        className={`w-full md:w-[40%] flex items-center justify-center px-6 py-12 bg-[#0e111b]/80 transition-all duration-1000 ease-out ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
      >
        <Card className="w-full max-w-md shadow-xl border-[#2a3149] bg-[#151929]/90 backdrop-blur-sm animate-fade-in">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex justify-center items-center mb-4">
              <div className="md:hidden mb-4">
                <img src="/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png" alt="Z-Transact logo" className="h-10" />
              </div>
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-glow">
                <span className="text-white text-3xl font-bold">Z</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-400 text-lg">
              Access your AI-powered assistant
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-base">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  <Input 
                    id="email" 
                    placeholder="finance@example.com" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10 h-12 bg-[#1c2136] border-[#2a3149] text-white focus:ring-[#6366F1] focus:border-[#6366F1] transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300 text-base">Password</Label>
                  <a href="#" className="text-sm text-[#6366F1] hover:text-[#A855F7] transition-colors hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-[#1c2136] border-[#2a3149] text-white focus:ring-[#6366F1] focus:border-[#6366F1] transition-all" 
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 mt-2 bg-gradient-to-r from-[#6366F1] to-[#A855F7] hover:from-[#5254CD] hover:to-[#9546D5] text-white font-medium text-base transition-all duration-300" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="text-center text-base text-gray-400">
                Don't have an account? <a href="#" className="text-[#6366F1] hover:text-[#A855F7] transition-colors hover:underline">Sign up</a>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-[#2a3149]">
              <div className="rounded-md bg-[#1c2136]/70 p-4 flex backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 mr-3 text-[#6366F1]" />
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
