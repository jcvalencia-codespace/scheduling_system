'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

export default function HistoryFilter({ onFilterChange, initialFilters, onReset }) {
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || '');
  const [selectedMonth, setSelectedMonth] = useState(initialFilters?.month || '');
  const [showAllDates, setShowAllDates] = useState(initialFilters?.showAllDates || false);
  
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

  const handleShowAllDatesChange = (checked) => {
    setShowAllDates(checked);
    onFilterChange('showAllDates', checked);
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setShowAllDates(false); // Add this line to reset the toggle
    onReset();
  };

  return (
    <Menu as="div" className="relative w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Menu.Button className="w-full sm:w-auto inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
          <span>Filter Options</span>
          {(selectedYear || selectedMonth || showAllDates) && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </Menu.Button>
        {(selectedYear || selectedMonth || showAllDates) && (
          <button
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Reset Filters
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
        <Menu.Items className="fixed sm:absolute left-1/2 sm:left-auto right-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 top-1/2 sm:top-auto -translate-y-1/2 sm:translate-y-0 mt-0 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] divide-y divide-gray-100 dark:divide-gray-700">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter Options</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Customize your view of the activity logs
            </p>
          </div>

          {/* Filter Content */}
          <div className="p-4 space-y-6">
            {/* Show All Dates Toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex-wrap gap-2">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Show All Historical Data</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Include records outside the current academic term
                </p>
              </div>
              <Switch
                checked={showAllDates}
                onChange={handleShowAllDatesChange}
                className={`${
                  showAllDates ? 'bg-green-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0`}
              >
                <span
                  className={`${
                    showAllDates ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm`}
                />
              </Switch>
            </div>

            {/* Date Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Year Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full rounded-md text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full rounded-md text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedYear || selectedMonth || showAllDates) && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {showAllDates && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      All Historical Data
                    </span>
                  )}
                  {selectedYear && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Year: {selectedYear}
                    </span>
                  )}
                  {selectedMonth !== '' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Month: {months.find(m => m.value === selectedMonth)?.label}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
