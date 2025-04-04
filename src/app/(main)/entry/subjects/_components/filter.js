'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ReactSelect = dynamic(() => import('react-select'), {
  ssr: false,
});

const customSelectStyles = {
  option: (styles, { isSelected, isFocused }) => ({
    ...styles,
    backgroundColor: isSelected ? '#323E8F' : isFocused ? '#E2E8F0' : 'white',
    color: isSelected ? 'white' : '#111827',
    ':active': {
      backgroundColor: '#323E8F',
      color: 'white'
    }
  }),
  control: (styles) => ({
    ...styles,
    borderColor: '#D1D5DB',
    '&:hover': {
      borderColor: '#323E8F'
    },
    boxShadow: 'none',
    '&:focus-within': {
      borderColor: '#323E8F',
      boxShadow: '0 0 0 1px #323E8F'
    }
  }),
  placeholder: (styles) => ({
    ...styles,
    color: '#111827',
  }),
};

export default function Filter({ filters, handleFilterChange, departments }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div>
          <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-9 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <ReactSelect
          value={filters.department ? {
            value: filters.department,
            label: `${filters.department} - ${departments.find(d => d.departmentCode === filters.department)?.departmentName || ''}`
          } : null}
          onChange={(option) => handleFilterChange('department', option?.value || '')}
          options={departments.map(dept => ({
            value: dept.departmentCode,
            label: `${dept.departmentCode} - ${dept.departmentName}`
          }))}
          isClearable
          placeholder="All Departments"
          styles={customSelectStyles}
        />
      </div>
    </div>
  );
}
