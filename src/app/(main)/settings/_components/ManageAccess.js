"use client"

import { useState } from "react"
import { UserIcon, ShieldCheckIcon, DocumentCheckIcon } from "@heroicons/react/24/outline"

export default function ManageAccess() {
  const [loading, setLoading] = useState(false)
  const [programChairSettings, setProgramChairSettings] = useState({
    showMultipleSections: false,
    showFacultyDropdown: false,
  })
  const [deanSettings, setDeanSettings] = useState({
    showMultipleSections: true,
    showFacultyDropdown: true,
  })

  const handleSaveSettings = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      // Show toast notification
      const toast = document.createElement("div")
      toast.className =
        "fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md"
      toast.innerHTML = `
        <div class="font-bold">Settings saved</div>
        <div>Your access settings have been updated successfully.</div>
      `
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.remove()
      }, 3000)
    }, 1000)
  }

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <div className="bg-[#283275]/5 p-4 border-b">
        <div className="flex items-center gap-2 text-[#283275] text-xl font-semibold">
          <ShieldCheckIcon className="h-5 w-5" />
          Access Control Settings
        </div>
        <p className="text-sm text-gray-500 mt-1">Manage access permissions for different user roles</p>
      </div>
      <div className="p-6 bg-white">
        <div className="space-y-8">
          {/* Program Chair Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-[#283275]" />
              <h3 className="text-lg font-medium text-[#283275]">Program Chair Settings</h3>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="space-y-4 pl-2">
              <div className="flex items-start space-x-2">
                <div className="flex h-4 items-center">
                  <input
                    id="chairMultipleSections"
                    type="checkbox"
                    checked={programChairSettings.showMultipleSections}
                    onChange={(e) =>
                      setProgramChairSettings({
                        ...programChairSettings,
                        showMultipleSections: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#283275] focus:ring-[#283275]"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="chairMultipleSections" className="text-sm font-medium text-gray-700">
                    Show Multiple Sections Checkbox
                  </label>
                  <p className="text-sm text-gray-500">Allow program chairs to view and manage multiple sections</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex h-4 items-center">
                  <input
                    id="chairFacultyDropdown"
                    type="checkbox"
                    checked={programChairSettings.showFacultyDropdown}
                    onChange={(e) =>
                      setProgramChairSettings({
                        ...programChairSettings,
                        showFacultyDropdown: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#283275] focus:ring-[#283275]"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="chairFacultyDropdown" className="text-sm font-medium text-gray-700">
                    Show Faculty Dropdown
                  </label>
                  <p className="text-sm text-gray-500">Display faculty selection dropdown for program chairs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dean Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-[#283275]" />
              <h3 className="text-lg font-medium text-[#283275]">Dean Settings</h3>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="space-y-4 pl-2">
              <div className="flex items-start space-x-2">
                <div className="flex h-4 items-center">
                  <input
                    id="deanMultipleSections"
                    type="checkbox"
                    checked={deanSettings.showMultipleSections}
                    onChange={(e) =>
                      setDeanSettings({
                        ...deanSettings,
                        showMultipleSections: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#283275] focus:ring-[#283275]"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="deanMultipleSections" className="text-sm font-medium text-gray-700">
                    Show Multiple Sections Checkbox for Dean
                  </label>
                  <p className="text-sm text-gray-500">Allow deans to view and manage multiple sections</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex h-4 items-center">
                  <input
                    id="deanFacultyDropdown"
                    type="checkbox"
                    checked={deanSettings.showFacultyDropdown}
                    onChange={(e) =>
                      setDeanSettings({
                        ...deanSettings,
                        showFacultyDropdown: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#283275] focus:ring-[#283275]"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="deanFacultyDropdown" className="text-sm font-medium text-gray-700">
                    Show Faculty Dropdown for Dean
                  </label>
                  <p className="text-sm text-gray-500">Display faculty selection dropdown for deans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t bg-slate-50 p-4 flex justify-start">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-md text-white ${
            loading ? "bg-[#283275]/70" : "bg-[#283275] hover:bg-[#283275]/90"
          } transition-colors`}
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <DocumentCheckIcon className="mr-2 h-4 w-4" /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
