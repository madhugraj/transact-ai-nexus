
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/UserAuthContext';
import AppSidebar from './AppSidebar';
import StatusBanner from './StatusBanner';
import NotificationCenter from './NotificationCenter';
import AppFooter from './AppFooter';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse-light text-xl font-medium">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <StatusBanner />
          <NotificationCenter />
        </div>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export default AppLayout;
