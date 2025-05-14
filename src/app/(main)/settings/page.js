"use client"

import { useState } from "react"
import ManageAccount from "./_components/ManageAccount"
import ManageAccess from "./_components/ManageAccess"
import { UserCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import useAuthStore from "@/store/useAuthStore"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account")
  const { user } = useAuthStore()
  const showAccessTab = user?.role === 'Administrator'  // Only show access tab for administrators

  // If access tab is active but user shouldn't see it, switch to account tab
  if (activeTab === "access" && !showAccessTab) {
    setActiveTab("account")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl bg-[#f8f9fa] rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-black">Settings</h1>
      <p className="text-gray-600 mb-4 text-sm"> View and manage your account settings</p>
      {/* Custom Tabs */}
      <div className="w-full mb-8">
        <div className={`grid w-full ${showAccessTab ? 'grid-cols-2' : 'grid-cols-1'} bg-slate-100 rounded-lg overflow-hidden`}>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
              activeTab === "account" ? "bg-[#283275] text-white" : "text-gray-600 hover:bg-slate-200"
            }`}
          >
            <UserCircleIcon className="h-5 w-5" />
            <span>Manage Account</span>
          </button>
          {showAccessTab && (
            <button
              onClick={() => setActiveTab("access")}
              className={`flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
                activeTab === "access" ? "bg-[#283275] text-white" : "text-gray-600 hover:bg-slate-200"
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Manage Access</span>
            </button>
          )}
        </div>

        <div className="mt-6">
          {activeTab === "account" && <ManageAccount />}
          {activeTab === "access" && showAccessTab && <ManageAccess />}
        </div>
      </div>
    </div>
  )
}
