
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
      {/* Left Panel (60%) - Hero Section with animations */}
      <div 
        className={`hidden md:flex md:w-[60%] flex-col justify-center items-start p-8 lg:p-16 xl:p-24 text-white relative transition-all duration-1000 ease-out ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1D2E] to-[#101322] opacity-95"></div>
        
        {/* Animated gradient overlay with particle effect */}
        <div className="absolute inset-0 bg-[url('/lovable-uploads/27845ced-a36a-431c-8cd1-5016f13aab53.png')] bg-cover opacity-[0.04]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-purple-900/10 animate-flow"></div>
        
        {/* Particle effect (simulated with dots) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="particle-container">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: `${Math.random() * 0.5}`,
                  animation: `float ${Math.random() * 20 + 10}s linear infinite`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center mb-10">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-glow mb-4">
              <span className="text-white text-3xl font-bold">Z</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-gradient">
            Z-Transact AI Assistant
          </h1>
          
          <h2 className="text-xl md:text-2xl mb-8 text-blue-200 font-light">
            Built to Think Like an Auditor. Designed to Move Like an Analyst.
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <p className="text-lg">
              Z-Transact is your intelligent automation partner for finance and audit operations. 
              It seamlessly handles invoice validation, payment tracking, client queries, and 
              compliance monitoring — all powered by purpose-built AI agents.
            </p>
            
            <p className="text-lg">
              Every interaction is designed to reduce manual overhead, accelerate reviews, and surface 
              actionable insights. Whether you're managing workflows or verifying financials, Z-Transact 
              works like a junior auditor that never sleeps — fast, accurate, and context-aware.
            </p>
            
            <p className="text-lg">
              Start transforming your finance operations with intelligent automation, real-time analysis, 
              and effortless scale — all from one unified platform.
            </p>
          </div>
          
          {/* Z avatar/mascot with pulsing effect */}
          <div className="mt-12 flex items-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-glow animate-pulse-light">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
            <div className="ml-4">
              <p className="text-blue-200 text-sm font-medium">Let Z-Transact handle the repetitive,</p>
              <p className="text-white font-semibold">so you can focus on the strategic.</p>
            </div>
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
              Access your AI-powered financial assistant
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
