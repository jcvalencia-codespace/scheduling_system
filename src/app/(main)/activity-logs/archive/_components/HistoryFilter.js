'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/outline';

export default function HistoryFilter({ onFilterChange, initialFilters, onReset }) {
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || '');
  const [selectedMonth, setSelectedMonth] = useState(initialFilters?.month || '');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const handleYearChange = (value) => {
    setSelectedYear(value);
    onFilterChange('year', value);
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    onFilterChange('month', value);
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    onReset();
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div className="flex space-x-2">
        <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
          Filter
        </Menu.Button>
        {(selectedYear || selectedMonth) && (
          <button
            onClick={handleReset}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
          >
            Reset
          </button>
        )}
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-1 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]">
          <div className="p-4 space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Filter history records by year and month. By default, only records within the current term are shown. 
                Using these filters will show records outside the current term period.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="mt-1 text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="mt-1 text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
