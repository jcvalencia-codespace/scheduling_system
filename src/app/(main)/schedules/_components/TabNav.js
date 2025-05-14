'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AcademicCapIcon, UserGroupIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'

export default function TabNav() {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Class Schedules',
      href: '/schedules',
      icon: AcademicCapIcon,
    },
    {
      name: 'Faculty Schedules',
      href: '/schedules/faculty',
      icon: UserGroupIcon,
    },
    {
      name: 'Room Schedules',
      href: '/schedules/room',
      icon: BuildingOffice2Icon,
    },
  ]

  return (
    <nav className="border-b rounded-xl border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-sm dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 dark:shadow-sm mb-4 w-full">
      <div className="mx-auto px-2 sm:px-6">
        <div className="flex h-14 justify-between">
          <div className="flex w-full justify-center sm:justify-start overflow-x-auto">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    group relative inline-flex items-center px-2 sm:px-4 pt-3 pb-2.5 text-xs sm:text-sm font-medium
                    transition-all duration-200 ease-in-out min-w-fit
                    ${pathname === tab.href 
                      ? 'text-[#323E8F] dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
                  `}
                >
                  <div
                    className={`
                      absolute bottom-0 left-0 h-0.5 w-full transform
                      ${pathname === tab.href 
                        ? 'bg-[#323E8F] dark:bg-blue-400' 
                        : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600'}
                      transition-all duration-200 ease-in-out
                    `}
                  />
                  <tab.icon 
                    className={`
                      h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 transition-all duration-200
                      ${pathname === tab.href
                        ? 'text-[#323E8F] dark:text-blue-400 transform scale-110'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
                      }
                    `}
                  />
                  <span className="whitespace-nowrap">{tab.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
