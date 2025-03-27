import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ViewSubjectModal({ isOpen, onClose, assignment }) {
  // Group subjects by term
  const groupedSubjects = assignment?.allSubjects?.sort((a, b) => a.term - b.term) || [];

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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Assigned Subjects for {assignment?.classId?.sectionName} - {assignment?.classId?.courseCode}
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          Year Level: <span className="font-medium">{assignment?.yearLevel} Year</span>
                        </p>
                        
                        {groupedSubjects.map((termGroup, index) => (
                          <div key={index} className="mb-6 last:mb-0">
                            <h4 className="font-medium text-gray-900 mb-2">Term {termGroup.term}:</h4>
                            <ul className="space-y-2">
                              {termGroup.subjects.map((subject) => (
                                <li 
                                  key={subject._id}
                                  className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200"
                                >
                                  {subject.subjectCode} - {subject.subjectName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
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
