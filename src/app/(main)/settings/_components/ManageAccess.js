"use client"

import { useState, useEffect } from "react"
import { UserIcon, ShieldCheckIcon, DocumentCheckIcon } from "@heroicons/react/24/outline"
import { saveAccessSettings, getAccessSettings } from "../_actions"
import useAuthStore from "@/store/useAuthStore"
import Swal from "sweetalert2"

export default function ManageAccess() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [programChairSettings, setProgramChairSettings] = useState({
    showMultipleSections: false,
    showFacultyDropdown: false,
  })
  const [deanSettings, setDeanSettings] = useState({
    showMultipleSections: true,
    showFacultyDropdown: true,
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [programChairResponse, deanResponse] = await Promise.all([
          getAccessSettings('Program Chair'),
          getAccessSettings('Dean')
        ]);

        if (programChairResponse.success) {
          // Parse the settings if they're serialized
          setProgramChairSettings(
            typeof programChairResponse.data === 'string' 
              ? JSON.parse(programChairResponse.data) 
              : programChairResponse.data
          );
        }
        if (deanResponse.success) {
          // Parse the settings if they're serialized
          setDeanSettings(
            typeof deanResponse.data === 'string' 
              ? JSON.parse(deanResponse.data) 
              : deanResponse.data
          );
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    }

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Serialize the data before sending
      const savePromises = [
        saveAccessSettings('Program Chair', {
          ...JSON.parse(JSON.stringify(programChairSettings)),
          userId: user._id
        }),
        saveAccessSettings('Dean', {
          ...JSON.parse(JSON.stringify(deanSettings)),
          userId: user._id
        })
      ];

      const results = await Promise.all(savePromises);

      if (results.every(result => result.success)) {
        await Swal.fire({
          icon: 'success',
          title: 'Settings Saved',
          text: 'Access settings have been updated successfully',
          timer: 1500
        });
      } else {
        throw new Error('Failed to save some settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save settings'
      });
    } finally {
      setLoading(false)
    }
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