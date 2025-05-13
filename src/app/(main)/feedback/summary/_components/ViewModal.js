'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ViewModal({ isOpen, onClose, feedback }) {
  if (!feedback) return null;

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    inProgress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {feedback.subject}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Message</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {feedback.type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[feedback.priority]}`}>
                        {feedback.priority}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[feedback.status]}`}>
                        {feedback.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {feedback.submittedBy?.firstName} {feedback.submittedBy?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{feedback.submittedBy?.email}</p>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
