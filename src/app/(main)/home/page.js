'use client';

import { useState } from 'react';
import NewScheduleModal from './_components/NewScheduleModal';

export default function HomePage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    return `${hour}${hour >= 12 ? 'pm' : 'am'}`;
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 pt-12">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Class Schedule</h1>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center rounded-md bg-[#4285F4] px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none"
            >
              + New Entry
            </button>
            <button className="flex-1 sm:flex-initial flex items-center justify-center rounded-md bg-[#4A5568] px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none">
              Print Schedule
            </button>
          </div>
        </div>

        {/* Class Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
            View Schedule of Class:
          </label>
          <div className="relative w-full sm:w-auto min-w-[240px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Please select a class</option>
              {/* Add class options here */}
            </select>
          </div>
        </div>

        {/* Schedule Title */}
        <div className="text-center my-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Schedule for Term 1</h2>
          <p className="mt-1 text-sm text-gray-600">SY - 2024-2025</p>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="w-20 bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {timeSlots.map((time, i) => (
                    <tr key={time} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">
                        {time}
                      </td>
                      {weekDays.map((day) => (
                        <td
                          key={`${day}-${time}`}
                          className="whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500"
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <NewScheduleModal
          isOpen={isNewScheduleModalOpen}
          onClose={() => setIsNewScheduleModalOpen(false)}
        />
      </div>
    </div>
  );
}
