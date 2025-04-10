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

// Add to your imports
import { useNotifications } from '../context/NotificationsContext';
import moment from 'moment';

// Add this import at the top with other imports
import Swal from 'sweetalert2';

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout: logoutStore } = useAuthStore();
  // Update this line to include markAllAsRead
  // Update the destructuring to include clearAll
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();


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
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => markAsRead(notification._id)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/50 ${
                          !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {moment(notification.createdAt).fromNow()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* // In the notifications dropdown, add this before the closing div of max-h-96 */}
                {notifications.length > 0 && (
                  <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
                    <button
                      onClick={async () => {
                        clearAll();
                        const Toast = Swal.mixin({
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 5000,
                          timerProgressBar: true,
                          background: '#10B981',
                          color: '#ffffff'
                        });
                        
                        Toast.fire({
                          icon: 'success',
                          title: 'Notifications cleared successfully'
                        });
                      }}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      Clear All Notifications
                    </button>
                  </div>
                )}
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
              <div className="w-10 h-10 rounded-full bg-[#35408E] text-white flex items-center justify-center">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
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
                  <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
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

function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
  }
}
