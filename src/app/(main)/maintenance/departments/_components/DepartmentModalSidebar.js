import { BuildingOffice2Icon } from "@heroicons/react/24/outline"

export default function DepartmentModalSidebar({ department }) {
  return (
    <div className="w-full md:w-1/3 bg-gradient-to-br from-[#323E8F] to-[#4150B5] p-8 text-white">
      <div className="h-full flex flex-col">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
            <BuildingOffice2Icon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">
            {department ? "Edit Department" : "Add New Department"}
          </h2>
          <p className="mt-2 text-blue-100 text-sm">
            {department
              ? "Update department information and settings"
              : "Create a new department by filling out the required information"}
          </p>
        </div>

        <div className="space-y-6 flex-grow">
          <div>
            <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wider mb-3">
              Instructions
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                  1
                </span>
                <span>Enter the department code</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                  2
                </span>
                <span>Provide the department name</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="text-sm text-blue-100">
            <p>Department Code Format:</p>
            <div className="mt-1 grid grid-cols-1 gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-white/10">Use standard format (e.g., CCS, COED)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
