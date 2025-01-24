'use client';

import { useAuth } from '@/hooks/useAuth';
import TopBar from '../components/TopBar';
import { SidebarProvider } from '../context/SidebarContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth();

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen flex-col">
          <TopBar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
