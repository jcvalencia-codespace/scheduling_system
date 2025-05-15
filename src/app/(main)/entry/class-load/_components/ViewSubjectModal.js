"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, BookOpenIcon, ClockIcon, AcademicCapIcon, CalendarIcon } from "@heroicons/react/24/outline"

export default function ViewSubjectModal({ isOpen, onClose, assignment }) {
  // Group subjects by term
  const subjectsByTerm =
    assignment?.subjects?.reduce((acc, subj) => {
      const term = subj.term
      if (!acc[term]) {
        acc[term] = []
      }
      acc[term].push(subj)
      return acc
    }, {}) || {}

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 block z-10">
                  <button
                    type="button"
                    className="rounded-full bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 p-1.5 transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row">
                  {/* Left sidebar */}
                  <div className="w-full md:w-1/3 bg-gradient-to-br from-[#323E8F] to-[#4150B5] p-8 text-white">
                    <div className="h-full flex flex-col">
                      <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                          <AcademicCapIcon className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Subject Details</h2>
                        <p className="mt-2 text-blue-100 text-sm">View all assigned subjects for this class</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white/10 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wider mb-2">
                            Class Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                                <BookOpenIcon className="h-4 w-4 text-blue-200" />
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-blue-100">Section</p>
                                <p className="text-sm font-medium">{assignment?.classId?.sectionName}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                                <AcademicCapIcon className="h-4 w-4 text-blue-200" />
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-blue-100">Course</p>
                                <p className="text-sm font-medium">{assignment?.classId?.course?.courseCode}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                                <CalendarIcon className="h-4 w-4 text-blue-200" />
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-blue-100">Year Level</p>
                                <p className="text-sm font-medium">{assignment?.yearLevel} Year</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <div className="text-sm text-blue-100">
                          <p>
                            Academic Year:{" "}
                            <span className="font-medium text-white">{assignment?.academicYear || "N/A"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="w-full md:w-2/3 p-8 overflow-y-auto max-h-[80vh]">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assigned Subjects</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        All subjects assigned to {assignment?.classId?.sectionName} across terms
                      </p>
                    </div>

                    <div className="space-y-8">
                      {[1, 2, 3].map((term) => (
                        <div key={term} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                              <CalendarIcon className="h-4 w-4 text-[#323E8F] dark:text-[#4151B0] mr-2" />
                              Term {term}
                            </h4>
                          </div>

                          {subjectsByTerm[term]?.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                              {subjectsByTerm[term].map((subj) => (
                                <div key={subj.subject?._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                    <div className="mb-2 sm:mb-0">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-[#323E8F]/10 dark:bg-[#323E8F]/20 flex items-center justify-center mr-3 flex-shrink-0">
                                          <BookOpenIcon className="h-4 w-4 text-[#323E8F] dark:text-[#4151B0]" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {subj.subject?.subjectCode}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {subj.subject?.subjectName}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center bg-[#323E8F]/5 dark:bg-[#323E8F]/20 px-3 py-1.5 rounded-full">
                                      <ClockIcon className="h-4 w-4 text-[#323E8F] dark:text-[#4151B0] mr-1.5" />
                                      <span className="text-sm font-medium text-[#323E8F] dark:text-[#4151B0]">
                                        {subj.hours || "N/A"} Hours
                                      </span>
                                    </div>
                                  </div>

                                  {subj.subject?.description && (
                                    <div className="mt-3 pl-11">
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {subj.subject.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center">
                              <BookOpenIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No subjects assigned for this term
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#323E8F] hover:bg-[#35408E] dark:bg-[#4151B0] dark:hover:bg-[#4B5DC0] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
