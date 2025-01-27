'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon, CheckCircleIcon, ExclamationCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { logout } from '../(login)/_actions';

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout: logoutStore } = useAuthStore();

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

  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'New Schedule Update',
      message: 'Your class schedule for CSCI 101 has been updated',
      time: '2 minutes ago',
      icon: ExclamationCircleIcon,
      color: 'text-yellow-500'
    },
    {
      id: 2,
      type: 'success',
      title: 'Enrollment Confirmed',
      message: 'Successfully enrolled in MATH 201 for Spring 2025',
      time: '1 hour ago',
      icon: CheckCircleIcon,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'message',
      title: 'New Message from Dr. Smith',
      message: 'Please review the updated course materials...',
      time: '3 hours ago',
      icon: ChatBubbleLeftIcon,
      color: 'text-blue-500'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {notifications.length}
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <div className="flex items-start space-x-3">
                        <notification.icon className={`h-5 w-5 ${notification.color} mt-1`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center space-x-3"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src="/nu-shield.png"
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Good day, {user?.lastName}!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.department}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
