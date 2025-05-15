'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

export default function Filter({ filters, handleFilterChange, departments }) {
  const customStyles = {
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: 'var(--select-bg, #ffffff)',
      border: '1px solid var(--select-border, #e5e7eb)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: '#374151'
      }
    }),
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--select-bg, #ffffff)',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: state.isFocused ? '#3b82f6' : '#374151'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#323E8F' 
        : state.isFocused 
          ? 'var(--select-hover, #f3f4f6)' 
          : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--select-text, #111827)',
      '.dark &': {
        backgroundColor: state.isSelected 
          ? '#323E8F' 
          : state.isFocused 
            ? '#374151' 
            : 'transparent',
        color: state.isSelected ? '#ffffff' : '#e5e7eb'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--select-placeholder, #6b7280)',
      '.dark &': {
        color: '#9ca3af'
      }
    })
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.departmentCode,
    label: `${dept.departmentCode} - ${dept.departmentName}`
  }));

  return (
    <div className="flex justify-end">
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filter
          {Object.values(filters).some(value => value) && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-opacity-20 focus:outline-none z-10">
            <div className="p-3">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Department
                  </label>
                  <Select
                    value={departmentOptions.find(opt => opt.value === filters.department)}
                    onChange={(option) => handleFilterChange('department', option?.value || '')}
                    options={departmentOptions}
                    isClearable
                    placeholder="All Departments"
                    styles={customStyles}
                  />
                </div>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
