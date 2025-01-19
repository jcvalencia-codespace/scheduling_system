'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import ViewHistoryModal from '../_components/ViewHistoryModal';

export default function OverrideHistoryPage() {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Sample data - replace with actual data fetching
  const logs = [
    {
      id: 1,
      user: 'John Smith',
      action: 'Requested Override',
      details: 'Schedule override request for BSCS 1A',
      status: 'Pending',
      timestamp: '2024-01-19T10:30:00',
    },
    {
      id: 2,
      user: 'Jane Doe',
      action: 'Approved Override',
      details: 'Approved schedule override for BSIT 2B',
      status: 'Approved',
      timestamp: '2024-01-18T15:45:00',
    },
    {
      id: 3,
      user: 'Admin',
      action: 'Rejected Override',
      details: 'Rejected override request due to conflicts',
      status: 'Rejected',
      timestamp: '2024-01-17T09:15:00',
    },
  ];

  // Filtering function
  const filteredLogs = useMemo(() => {
    return logs.filter((log) =>
      Object.values(log).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [logs, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy hh:mm a');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Override History</h1>
          <p className="mt-2 text-sm text-gray-700">
            View all override requests and their status.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="rounded-md border-gray-300 py-1.5 text-sm focus:border-[#323E8F] focus:ring-[#323E8F]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">entries</span>
        </div>

        <div className="mt-2 sm:mt-0">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      #
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Timestamp
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.action}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.details}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleView(log)}
                          className="text-[#323E8F] hover:text-[#35408E]"
                        >
                          <EyeIcon className="h-5 w-5" />
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

      {/* View History Modal */}
      <ViewHistoryModal
        open={isViewModalOpen}
        setOpen={setIsViewModalOpen}
        log={selectedLog}
      />
    </div>
  );
}
