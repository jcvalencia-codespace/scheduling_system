'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ReactSelect = dynamic(() => import('react-select'), {
  ssr: false,
});

const customSelectStyles = {
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    backgroundColor: 'var(--select-bg, #ffffff)',
    border: '1px solid var(--select-border, #e5e7eb)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderRadius: '0.375rem',
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
    '&:hover': {
      borderColor: '#3b82f6'
    },
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
    },
    '&:hover': {
      backgroundColor: state.isSelected ? '#323E8F' : 'var(--select-hover, #f3f4f6)'
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--select-text, #111827)',
    '.dark &': {
      color: '#e5e7eb'
    }
  }),
  input: (base) => ({
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
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--select-placeholder, #6b7280)',
    '&:hover': {
      color: 'var(--select-text, #111827)'
    },
    '.dark &': {
      color: '#9ca3af',
      '&:hover': {
        color: '#e5e7eb'
      }
    }
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'var(--select-placeholder, #6b7280)',
    '&:hover': {
      color: 'var(--select-text, #111827)'
    },
    '.dark &': {
      color: '#9ca3af',
      '&:hover': {
        color: '#e5e7eb'
      }
    }
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'var(--select-border, #e5e7eb)',
    '.dark &': {
      backgroundColor: '#374151'
    }
  })
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Department</label>
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
