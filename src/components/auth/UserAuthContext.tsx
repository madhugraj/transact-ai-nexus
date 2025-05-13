
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define user roles
export type UserRole = 'finance_analyst' | 'project_manager' | 'auditor' | 'admin';

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Mock user data for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Finance',
    email: 'finance@example.com',
    role: 'finance_analyst',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=John'
  },
  {
    id: '2',
    name: 'Mary Manager',
    email: 'manager@example.com',
    role: 'project_manager',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mary'
  },
  {
    id: '3',
    name: 'Alex Auditor',
    email: 'auditor@example.com',
    role: 'auditor',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Alex'
  },
  {
    id: '4',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Admin'
  }
];

// Context interfaces
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('transactionAgentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && password === '123456') { // Simple password for demo
      setUser(foundUser);
      localStorage.setItem('transactionAgentUser', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('transactionAgentUser');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
