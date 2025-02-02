'use client';

import { useAuth } from '@/hooks/useAuth';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
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
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto p-4">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
