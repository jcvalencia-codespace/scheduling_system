import { ClockIcon } from "@heroicons/react/24/outline"

export default function ScheduleModalSidebar({ editMode, termInfo, facultyLoadDisplay, schoolYear, isLoadingFaculty }) {
    // Add debug logging to see what's being passed
    console.log('Faculty Load Display:', facultyLoadDisplay);

    return (
        <div className="w-full md:w-1/3 bg-gradient-to-br from-[#323E8F] to-[#4150B5] p-8 text-white">
            <div className="h-full flex flex-col">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                        <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        {editMode ? "Edit Schedule" : "New Schedule Entry"}
                    </h2>
                    <p className="mt-2 text-blue-100 text-sm">
                        {editMode
                            ? "Update scheduling information"
                            : "Create a new schedule entry"}
                    </p>

                    {/* Term Info */}
                    <div className="mt-auto pt-6">
                        <h4 className="text-sm font-medium text-indigo-200">Current Academic Year</h4>
                        <p className="text-lg font-semibold">{termInfo?.academicYear}</p>

                        <h4 className="text-sm font-medium text-indigo-200 mt-3">Active Term</h4>
                        <p className="text-lg font-semibold">{termInfo?.term}</p>
                    </div>
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
                                <span>Select section and faculty details</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    2
                                </span>
                                <span>Choose subject and class information</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    3
                                </span>
                                <span>Set schedule details and room</span>
                            </li>
                            {facultyLoadDisplay && (
                                <li className="flex items-start">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                        4
                                    </span>
                                    <span>Review faculty load information</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Faculty Load Info */}
                {facultyLoadDisplay && (
                    <div className="mt-auto pt-6 border-t border-white/10">
                        <h4 className="text-sm font-medium text-blue-100 uppercase tracking-wider mb-3">
                            Faculty Load Information
                        </h4>
                        {isLoadingFaculty ? (
                            <div className="space-y-3">
                                <div className="h-5 bg-white/20 rounded animate-pulse"></div>
                                <div className="h-5 bg-white/20 rounded animate-pulse"></div>
                                <div className="h-5 bg-white/20 rounded animate-pulse"></div>
                                <div className="h-5 bg-white/20 rounded animate-pulse"></div>
                                <div className="h-5 bg-white/20 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-100">Employment Type:</span>
                                    <span>{facultyLoadDisplay.employmentType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-100">Total Teaching Hours:</span>
                                    <span>{Number(facultyLoadDisplay.teachingHours).toFixed(1)} hrs</span>
                                </div>
                                {facultyLoadDisplay.employmentType.toLowerCase() === 'full-time' && (
                                    <>

                                        <div className="flex justify-between">
                                            <span className="text-blue-100">Approved Admin Hours:</span>
                                            <span>{Number(facultyLoadDisplay.actualAdminHours || 0).toFixed(1)} hrs</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-100">Available Admin Hours:</span>
                                            <span>{Number(facultyLoadDisplay.adminHours).toFixed(1)} hrs</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-blue-100">Maximum Load:</span>
                                    <span>{facultyLoadDisplay.totalHours} hrs</span>
                                </div>
                                {facultyLoadDisplay.subjectCodes.length > 0 && (
                                    <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                                        <span className="block text-blue-100 mb-1">Current Subjects Loaded:</span>
                                        <span>{facultyLoadDisplay.subjectCodes.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
