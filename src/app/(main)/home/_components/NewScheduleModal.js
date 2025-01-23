'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function NewScheduleModal({ isOpen, onClose }) {
  const scheduleTypes = ['Lecture', 'Laboratory', 'Tutorial'];
  const currentYear = new Date().getFullYear();
  const schoolYear = `${currentYear}-${currentYear + 1}`;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-black mb-4">
                  New Schedule
                </Dialog.Title>

                {/* School Year and Term Info */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="space-y-1 text-black">
                    <div className="flex gap-2">
                      <span className="font-medium">School Year:</span>
                      <span>{schoolYear}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Term:</span>
                      <span>Term 1</span>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6 mb-6">
                  <label className="flex items-center gap-2 text-black">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Pairing Schedule</span>
                  </label>
                  <label className="flex items-center gap-2 text-black">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Multiple Sections</span>
                  </label>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Section</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select a Section</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Faculty</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select a User</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Subject</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select a Subject</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Class Limit</label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter class limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Student Type</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select Student Type</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Days of Week</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select a Day</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Room</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select a Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Schedule Type</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        {scheduleTypes.map((type) => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Time From</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select Time From</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Time To</label>
                      <select className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select Time To</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 border border-gray-300"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
