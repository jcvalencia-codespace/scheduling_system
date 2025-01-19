'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import AddTermModal from './_components/AddTermModal';

export default function TermPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Sample data - replace with actual data fetching
  const terms = [
    {
      id: 1,
      academicYear: '2024-2025',
      term: 'Term 1',
      startDate: '2024-08-05',
      endDate: '2024-11-06',
      status: 'Active',
    },
    {
      id: 2,
      academicYear: '2024-2025',
      term: 'Term 2',
      startDate: '2024-11-18',
      endDate: '2025-03-25',
      status: 'Inactive',
    },
    {
      id: 3,
      academicYear: '2024-2025',
      term: 'Term 3',
      startDate: '2025-03-17',
      endDate: '2025-06-02',
      status: 'Inactive',
    },
    {
      id: 4,
      academicYear: '2025-2026',
      term: 'Term 1',
      startDate: '2025-08-11',
      endDate: '2025-11-11',
      status: 'Inactive',
    },
  ];

  // Filtering function
  const filteredTerms = useMemo(() => {
    return terms.filter((term) =>
      Object.values(term).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [terms, searchQuery]);

  const handleActivate = (termId) => {
    // Handle activation logic here
    console.log('Activating term:', termId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Term Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage academic terms and their schedules.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
            >
              Add Term
            </button>
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
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                />
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
                            Academic Year
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Term
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Start Date
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            End Date
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredTerms.map((term, index) => (
                          <tr key={term.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {term.academicYear}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {term.term}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(term.startDate)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(term.endDate)}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex justify-end space-x-2">
                                <button
                                  className="text-[#323E8F] hover:text-[#35408E]"
                                  onClick={() => {
                                    // Handle edit
                                  }}
                                >
                                  <PencilSquareIcon className="h-5 w-5" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => {
                                    // Handle delete
                                  }}
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                                {term.status !== 'Active' && (
                                  <button
                                    onClick={() => handleActivate(term.id)}
                                    className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-100"
                                  >
                                    Activate
                                  </button>
                                )}
                                {term.status === 'Active' && (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                    <CheckCircleIcon className="mr-1 h-4 w-4" />
                                    Active
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Term Modal */}
            <AddTermModal
              open={isAddModalOpen}
              setOpen={setIsAddModalOpen}
              title="Add New Term"
            />
          </div>
        </div>
      </div>
    </div>
  );
}