"use client"

import { useState } from "react"
import { Bell, Menu, Search, User, X } from "lucide-react"
import { useTheme } from "next-themes"

export default function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-900 dark:text-white">SAMS</span>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <NavLink href="/dashboard" active>
                Dashboard
              </NavLink>
              <NavLink href="/schedules">Schedules</NavLink>
              <NavLink href="/rooms">Rooms</NavLink>
              <NavLink href="/faculty">Faculty</NavLink>
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-colors"
                placeholder="Search..."
              />
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
            </button>

            <div className="ml-3 relative">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="hidden md:flex md:flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Admin User</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Administrator</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/dashboard" active>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/schedules">Schedules</MobileNavLink>
            <MobileNavLink href="/rooms">Rooms</MobileNavLink>
            <MobileNavLink href="/faculty">Faculty</MobileNavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">Admin User</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">admin@example.com</div>
              </div>
              <button className="ml-auto p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                <Bell className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <MobileNavLink href="/profile">Your Profile</MobileNavLink>
              <MobileNavLink href="/settings">Settings</MobileNavLink>
              <button
                onClick={toggleTheme}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
              <MobileNavLink href="/logout">Sign out</MobileNavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, active, children }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
        active
          ? "border-blue-500 text-gray-900 dark:text-white"
          : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </a>
  )
}

function MobileNavLink({ href, active, children }) {
  return (
    <a
      href={href}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        active
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </a>
  )
}
