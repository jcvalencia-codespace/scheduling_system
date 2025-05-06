import { AcademicCapIcon } from "@heroicons/react/24/outline"

export default function AssignModalSidebar({ editData, termInfo }) {
  return (
    <div className="w-full md:w-1/3 bg-gradient-to-br from-[#323E8F] to-[#4150B5] p-8 text-white">
      <div className="h-full flex flex-col">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">
            {editData ? "Edit Subject Assignment" : "Assign Subjects"}
          </h2>
          <p className="mt-2 text-blue-100 text-sm">
            {editData
              ? "Update subject assignments for the selected class"
              : "Assign subjects to classes for the current academic term"}
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
                <span>Select the year level and term</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                  2
                </span>
                <span>Choose one or more classes</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                  3
                </span>
                <span>Add subjects and specify hours</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                  4
                </span>
                <span>Submit the form to complete the assignment</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="text-sm text-blue-100">
            <p>
              Current Academic Year:{" "}
              <span className="font-medium text-white">{termInfo?.sy || "Loading..."}</span>
            </p>
            <p>
              Active Term:{" "}
              <span className="font-medium text-white">
                {termInfo ? `Term ${termInfo.term}` : "Loading..."}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
