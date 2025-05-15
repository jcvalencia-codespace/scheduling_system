'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';
import useAuthStore from '@/store/useAuthStore';
import Image from 'next/image';
import {
  HomeIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  BuildingLibraryIcon,
  UsersIcon,
  ListBulletIcon,
  ClockIcon,
  BookOpenIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  PresentationChartBarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

// Define role-based menu items
const roleMenuItems = {
  Dean: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: PresentationChartBarIcon,
    },
    {
      title: 'Schedules',
      href: '/schedules',
      icon: CalendarDaysIcon,
    },
    {
      title: 'Class Load',
      href: '/entry/class-load',
      icon: BuildingLibraryIcon,
    },
    {
      title: 'Admin Hours',
      href: '/admin-hours',
      icon: ClockIcon,
    },
    {
      title: 'Activity Logs',
      href: '/activity-logs',
      icon: ClipboardDocumentListIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Schedule History', href: '/activity-logs/schedule-history', icon: ListBulletIcon },
        { title: 'Archive', href: '/activity-logs/archive', icon: ListBulletIcon }
      ]
    },
    {
      title: 'Schedule Archive',
      href: '/schedule-archive',
      icon: ArchiveBoxIcon
    },
    {
      title: 'Send Feedback',
      href: '/feedback/send-feedback',
      icon: EnvelopeIcon
    },
    {
      title: 'Chat',
      href: '/chats',
      icon: ChatBubbleLeftRightIcon
    }
  ],
  'Program Chair': [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: PresentationChartBarIcon,
    },
    {
      title: 'Schedules',
      href: '/schedules',
      icon: CalendarDaysIcon,
    },
    {
      title: 'Class Load',
      href: '/entry/class-load',
      icon: BuildingLibraryIcon,
    },
    {
      title: 'Activity Logs',
      href: '/activity-logs',
      icon: ClipboardDocumentListIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Schedule History', href: '/activity-logs/schedule-history', icon: ListBulletIcon },
        { title: 'Archive', href: '/activity-logs/archive', icon: ListBulletIcon }
      ]
    },
    {
      title: 'Schedule Archive',
      href: '/schedule-archive',
      icon: ArchiveBoxIcon
    },
    {
      title: 'Send Feedback',
      href: '/feedback/send-feedback',
      icon: EnvelopeIcon
    },
    {
      title: 'Chat',
      href: '/chats',
      icon: ChatBubbleLeftRightIcon
    }
  ],
  Administrator: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: PresentationChartBarIcon,
    },
    {
      title: 'Schedules',
      href: '/schedules',
      icon: CalendarDaysIcon,
    },
    {
      title: 'Entry',
      href: '/entry',
      icon: PencilSquareIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Subjects', href: '/entry/subjects', icon: BookOpenIcon },
        { title: 'Sections', href: '/entry/sections', icon: BuildingLibraryIcon },
        { title: 'Class Load', href: '/entry/class-load', icon: BuildingLibraryIcon },
        { title: 'Rooms', href: '/entry/rooms', icon: BuildingLibraryIcon },
        { title: 'Users', href: '/entry/users', icon: UsersIcon }
      ]
    },
    {
      title: 'Maintenance',
      href: '/maintenance',
      icon: WrenchScrewdriverIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Courses', href: '/maintenance/courses', icon: ListBulletIcon },
        { title: 'Departments', href: '/maintenance/departments', icon: ListBulletIcon },
      ]
    },
    {
      title: 'Term',
      href: '/term',
      icon: AcademicCapIcon
    },
    {
      title: 'Admin Hours',
      href: '/admin-hours',
      icon: ClockIcon,
    },
    {
      title: 'Activity Logs',
      href: '/activity-logs',
      icon: ClipboardDocumentListIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Schedule History', href: '/activity-logs/schedule-history', icon: ListBulletIcon },
        { title: 'Archive', href: '/activity-logs/archive', icon: ListBulletIcon }
      ]
    },
    {
      title: 'Schedule Archive',
      href: '/schedule-archive',
      icon: ArchiveBoxIcon
    },
    {
      title: 'Feedback',
      href: '/feedback',
      icon: EnvelopeIcon,
      hasDropdown: true,
      subItems: [
        { title: 'Send Feedback', href: '/feedback/send-feedback', icon: EnvelopeIcon },
        { title: 'Feedback Summary', href: '/feedback/summary', icon: ListBulletIcon },
      ]
    },
    {
      title: 'Chat',
      href: '/chats',
      icon: ChatBubbleLeftRightIcon
    }
  ],
  Faculty: [
    {
      title: 'Schedules',
      href: '/schedules/faculty',
      icon: CalendarDaysIcon,
    },
    {
      title: 'Chat',
      href: '/chats',
      icon: ChatBubbleLeftRightIcon
    },
    {
      title: 'Send Feedback',
      href: '/feedback/send-feedback',
      icon: EnvelopeIcon
    },
    {
      title: 'Schedule Archive',
      href: '/schedule-archive/faculty',
      icon: ArchiveBoxIcon
    }
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar, isMobile } = useSidebar();
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useAuthStore();

  // Get menu items based on user role
  const menuItems = roleMenuItems[user?.role || 'Faculty'] || roleMenuItems.Faculty;

  const toggleExpand = (title) => {
    setExpandedItems(prev => {
      // Create a new object with all items set to false
      const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      // Toggle only the clicked item
      return {
        ...allClosed,
        [title]: !prev[title]
      };
    });
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      {/* Logo and Close Button */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex items-center gap-2">
          <Image
            src="https://i.imgur.com/jYFYI4l.png"
            alt="NU Shield"
            width={32}
            height={32}
          />
          <h1 className="text-xl font-bold text-[#323E8F] dark:text-white">NU Baliwag</h1>
        </div>
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col space-y-1 p-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const isExpanded = expandedItems[item.title];

              // Modify href for faculty users accessing archive
              const href = user?.role === 'Faculty' && item.title === 'Schedule Archive' 
                ? '/schedule-archive/faculty'
                : item.href;

              return (
                <li key={item.title}>
                  <div className="relative">
                    <Link
                      href={href}
                      className={`flex items-center justify-between p-2 rounded-md text-gray-900 dark:text-gray-100 hover:bg-[#FFD41C] hover:text-black dark:hover:text-black ${isActive ? 'bg-[#323E8F] text-white' : ''
                        }`}
                      onClick={item.hasDropdown ? (e) => {
                        e.preventDefault();
                        toggleExpand(item.title);
                      } : undefined}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </div>
                      {item.hasDropdown && (
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                      )}
                    </Link>

                    {item.hasDropdown && (
                      <ul
                        className={`mt-1 ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        {item.subItems?.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center space-x-2 p-2 rounded-md text-gray-900 dark:text-gray-100 hover:bg-[#FFD41C] hover:text-black dark:hover:text-black ${pathname === subItem.href ? 'bg-[#323E8F] text-white' : ''
                                }`}
                            >
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="flex w-full items-center space-x-2 rounded-md p-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}