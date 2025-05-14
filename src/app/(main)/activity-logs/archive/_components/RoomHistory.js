'use client';

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import Pagination from './Pagination';

export default function RoomHistory({ history, filters, activeTerm }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'text-green-600';
      case 'updated': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredHistory = history.filter(entry => {
    // First apply academicYear filter only if showAllDates is false
    if (!filters.showAllDates) {
      const entryYear = entry.academicYear?.toString();
      const targetYear = activeTerm?.academicYear?.toString();
      return entryYear === targetYear;
    }

    // When showAllDates is true, show all entries regardless of academicYear
    // Only apply year/month filters if they exist
    const entryDate = new Date(entry.updatedAt);
    if (filters?.year || filters?.month !== '') {
      const matchesYear = !filters.year || entryDate.getFullYear().toString() === filters.year;
      const matchesMonth = filters.month === '' || entryDate.getMonth().toString() === filters.month;
      return matchesYear && matchesMonth;
    }
    
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="overflow-x-auto pb-4">
      {/* Mobile view */}
      <div className="block md:hidden px-2 pb-4">
        <div className="space-y-4">
          {currentItems.map((entry, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {formatDate(entry.updatedAt)}
                </div>
                <span className={`capitalize text-sm font-medium ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Room Code:</label>
                  <div className="font-medium text-gray-900 dark:text-white">{entry.roomDetails.code}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Room Name:</label>
                  <div className="font-medium text-gray-900 dark:text-white">{entry.roomDetails.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Capacity:</label>
                    <div className="text-gray-900 dark:text-gray-300">{entry.roomDetails.capacity}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Status:</label>
                    <div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        entry.roomDetails.status === 'Active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {entry.roomDetails.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Department:</label>
                  <div className="text-gray-900 dark:text-gray-300">{entry.roomDetails.department}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Updated by:</label>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">{entry.updatedBy.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{entry.updatedBy.email}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.updatedBy.role} {entry.updatedBy.course?.name ? `- ${entry.updatedBy.course.name}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Room Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Room Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Updated by
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.map((entry, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                    {formatDate(entry.updatedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`capitalize font-medium ${getActionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {entry.roomDetails.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {entry.roomDetails.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {entry.roomDetails.capacity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {entry.roomDetails.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.roomDetails.status === 'Active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {entry.roomDetails.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">{entry.updatedBy.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{entry.updatedBy.email}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {entry.updatedBy.role} {entry.updatedBy.course?.name ? `- ${entry.updatedBy.course.name}` : ''}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No history records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-white dark:bg-gray-800 sticky bottom-0 shadow-t">
        <Pagination
          totalItems={filteredHistory.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
