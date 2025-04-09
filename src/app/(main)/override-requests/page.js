'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function OverrideRequests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Sample data - replace with actual data fetching
  const requests = [
    {
      id: 1,
      facultyName: 'Dr. Robert Chen',
      facultyId: 'FAC-2023-101',
      department: 'Computer Science',
      courseCode: 'CS101',
      currentSchedule: 'MWF 10:00 AM - 11:30 AM (Room 301)',
      requestedSchedule: 'TTH 1:00 PM - 2:30 PM (Room 405)',
      reason: 'Conflict with department meeting schedule',
      status: 'Pending'
    },
    {
      id: 2,
      facultyName: 'Prof. Maria Santos',
      facultyId: 'FAC-2023-089',
      department: 'Mathematics',
      courseCode: 'MATH201',
      currentSchedule: 'TTH 9:00 AM - 10:30 AM (Room 205)',
      requestedSchedule: 'MWF 2:00 PM - 3:30 PM (Room 208)',
      reason: 'Research laboratory schedule adjustment',
      status: 'Approved'
    }
  ];

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Override Requests</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage faculty schedule override requests
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="rounded-md border-gray-300 py-1.5 text-sm focus:border-[#323E8F] focus:ring-[#323E8F] text-black"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>

              <div className="mt-2 sm:mt-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                />
              </div>
            </div>

            {/* Simplified Table */}
            <div className="mt-8 flow-root">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">#</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Faculty</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Course</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request, index) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">{request.facultyName}</div>
                        <div className="text-gray-500">{request.department}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">{request.courseCode}</td>
                      <td className="px-3 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'Denied'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm font-medium flex justify-center items-center">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-[#323E8F] hover:text-[#35408E] hover:bg-[#323E8F]/5"
                        >
                          <EyeIcon className="h-4 w-4 mr-1.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Transition.Root show={isViewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsViewModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-3xl">
                  {selectedRequest && (
                    <>
                      <div className="absolute right-4 top-4 z-10">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setIsViewModalOpen(false)}
                        >
                          <span className="sr-only">Close</span>
                          <span className="text-3xl">×</span>
                        </button>
                      </div>

                      <div className="px-6 py-5">
                        <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-5">
                          Override Request Details
                        </Dialog.Title>

                        {/* Schedule Changes */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                          <div className="bg-[#323E8F] px-6 py-3 rounded-t-xl">
                            <h4 className="text-base font-semibold text-white">
                              Request Details
                            </h4>
                          </div>
                          <div className="px-6 py-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-900">{selectedRequest.facultyName}</p>
                                <p className="text-sm text-gray-500">{selectedRequest.department}</p>
                                <p className="text-sm text-gray-500">ID: {selectedRequest.facultyId}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Course</h4>
                                <p className="mt-1 text-sm text-gray-900">{selectedRequest.courseCode}</p>
                              </div>
                            </div>
                          </div>
                          <div className="px-6 py-4">
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Current Schedule</p>
                                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.currentSchedule}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Requested Schedule</p>
                                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.requestedSchedule}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Reason for Change</h4>
                                <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-500 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 transition-colors"
                            onClick={() => setIsViewModalOpen(false)}
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
                            onClick={() => setIsViewModalOpen(false)}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
                            onClick={() => setIsViewModalOpen(false)}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1.5" />
                            Deny
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}