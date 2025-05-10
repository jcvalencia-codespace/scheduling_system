"use client"

import { useMemo } from 'react';
import moment from 'moment';
import { ScheduleHistorySkeleton } from './Skeleton';

export default function ScheduleHistoryTable({ history, isLoading, currentUser }) {
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [history]);

  if (isLoading) return <ScheduleHistorySkeleton />;

  return (
    <div className="mt-4 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Action
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Schedule Details
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Updated By
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No history found
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((entry) => (
                    <tr key={entry._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {entry.action}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <p>Subject: {entry.scheduleDetails.subject.code} - {entry.scheduleDetails.subject.name}</p>
                          <p>Faculty: {entry.scheduleDetails.faculty.name}</p>
                          <p>Sections: {entry.scheduleDetails.sections.map(s => s.name).join(', ')}</p>
                          <p>Department: {entry.scheduleDetails.department?.name || 'N/A'}</p>
                          <p>Term: {` ${entry.scheduleDetails.term || 'N/A'}`}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {entry.updatedBy.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {moment(entry.updatedAt).format('MMM DD, YYYY hh:mm A')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
