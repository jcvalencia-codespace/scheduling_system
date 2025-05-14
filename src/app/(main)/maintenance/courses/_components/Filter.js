'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';

export default function Filter({ filters, handleFilterChange, departments }) {
  const customStyles = {
    control: (styles) => ({
      ...styles,
      borderRadius: "0.5rem",
      borderColor: "#E2E8F0",
      boxShadow: "none",
      minHeight: "42px",
      "&:hover": {
        borderColor: "#323E8F",
      },
      padding: "0 4px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999999,
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      backgroundColor: isSelected ? "#323E8F" : isFocused ? "#F3F4F6" : "white",
      color: isSelected ? "white" : "#111827",
    }),
  };

  const departmentOptions = departments?.map(dept => ({
    value: dept.departmentCode,
    label: `${dept.departmentCode} - ${dept.departmentName}`
  })) || [];

  return (
    <div className="flex justify-end">
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
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
          <Menu.Items className="absolute right-0 w-80 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
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
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
