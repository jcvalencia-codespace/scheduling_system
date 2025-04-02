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
    const entryDate = new Date(entry.updatedAt);
    
    // If filters are active, apply them
    if (filters?.year || filters?.month !== '') {
      const matchesYear = !filters.year || entryDate.getFullYear().toString() === filters.year;
      const matchesMonth = filters.month === '' || entryDate.getMonth().toString() === filters.month;
      return matchesYear && matchesMonth;
    }
    
    // If no filters, check term dates
    if (activeTerm?.startDate && activeTerm?.endDate) {
      const termStart = new Date(activeTerm.startDate);
      const termEnd = new Date(activeTerm.endDate);
      return entryDate >= termStart && entryDate <= termEnd;
    }
    
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated by
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((entry, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.roomDetails.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.roomDetails.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.roomDetails.capacity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.roomDetails.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.roomDetails.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.roomDetails.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{entry.updatedBy.name}</span>
                    <span className="text-gray-500 text-xs">{entry.updatedBy.email}</span>
                    <span className="text-gray-500 text-xs">
                      {entry.updatedBy.role} {entry.updatedBy.course ? `- ${entry.updatedBy.course}` : ''}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No history records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        totalItems={filteredHistory.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
