'use client';

import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import Loading from '../components/Loading';
import { useState, useEffect } from 'react';
import { LoadingProvider } from '../context/LoadingContext';
import { ChatProvider } from '@/app/context/ChatContext';

export default function MainLayout({ children }) {
  const { isSidebarOpen, isMobile } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Increased to 2 seconds to make it more visible
    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingProvider>
      <ChatProvider>
        {isLoading && <Loading />}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSidebarOpen && !isMobile ? 'lg:pl-64' : ''
            }`}
          >
            <TopBar />
            <main className="p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>

        <div id="modal-root"></div>
    

      </ChatProvider>

    </LoadingProvider>
  );
}