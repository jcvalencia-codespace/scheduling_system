'use client';

import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';

export default function MainLayout({ children }) {
  const { isSidebarOpen, isMobile } = useSidebar();

  return (
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
  );
}