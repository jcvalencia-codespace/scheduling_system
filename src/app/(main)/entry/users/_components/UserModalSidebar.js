import { UserCircleIcon } from "@heroicons/react/24/outline"

export default function UserModalSidebar({ user }) {
    return (
        <div className="w-full md:w-1/3 bg-gradient-to-br from-[#323E8F] to-[#4150B5] p-8 text-white">
            <div className="h-full flex flex-col">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        {user ? "Edit User" : "Add New User"}
                    </h2>
                    <p className="mt-2 text-blue-100 text-sm">
                        {user
                            ? "Update user information and settings"
                            : "Create a new user by filling out the required information"}
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
                                <span>Enter personal information</span>
                            </li>
                               <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    2
                                </span>
                                <span>Ensure email is correct for credentials sending</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    3
                                </span>
                                <span>Set role and access level</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    4
                                </span>
                                <span>Assign department and course</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs mr-2 mt-0.5 flex-shrink-0">
                                    5
                                </span>
                                <span>Choose employment type</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <div className="text-sm text-blue-100">
                        <p>Available Roles:</p>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-white/10">Administrator</span>
                            <span className="px-2 py-1 rounded bg-white/10">Dean</span>
                            <span className="px-2 py-1 rounded bg-white/10">Program Chair</span>
                            <span className="px-2 py-1 rounded bg-white/10">Faculty</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
