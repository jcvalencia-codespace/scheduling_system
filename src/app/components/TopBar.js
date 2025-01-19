'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  // Function to get page title from pathname
  const getPageTitle = (path) => {
    // Remove leading slash and split path
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    
    // Get the last segment and format it
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm transition-shadow dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Title and Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getPageTitle(pathname)}</h1>
          </div>
        </div>

        {/* Right: Search, Theme Toggle, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          {/* <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Search"
              className="w-full rounded-full border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-[#323E8F] dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div> */}

          {/* Theme Toggle */}
          <div className="flex items-center rounded-full bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setTheme('light')}
              className={`rounded-full p-2 ${
                theme === 'light'
                  ? 'bg-white text-[#323E8F] shadow-sm dark:bg-gray-700 dark:text-[#323E8F]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <SunIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`rounded-full p-2 ${
                theme === 'dark'
                  ? 'bg-white text-[#323E8F] shadow-sm dark:bg-gray-700 dark:text-[#323E8F]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <MoonIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Notifications */}
          <button className="relative rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              3
            </span>
          </button>

          {/* Profile */}
          <button className="flex items-center space-x-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src="/nu-shield.png"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Jhon Smith</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Administrator</div>
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
