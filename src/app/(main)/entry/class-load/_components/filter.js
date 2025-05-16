'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getAllCourses, getCoursesByDepartment, getAllYearLevels, getAllSections, getYearLevelsByDepartment, getSectionsByDepartment } from '../_actions';

// Dynamically import React-Select with disabled SSR
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
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: 'var(--bg-control, white)',
    borderColor: state.isFocused ? '#323E8F' : '#D1D5DB',
    '&:hover': {
      borderColor: '#323E8F'
    },
    boxShadow: state.isFocused ? '0 0 0 1px #323E8F' : 'none',
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-menu, white)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--text-primary, #111827)',
  }),
  placeholder: (styles) => ({
    ...styles,
    color: '#111827',
  }),
};

export default function Filter({ filters, handleFilterChange, filterOptions, departments }) {
  const [isMounted, setIsMounted] = useState(false);
  const [allData, setAllData] = useState({
    courses: [],
    yearLevels: [],
    sections: []
  });
  const [filteredData, setFilteredData] = useState({
    courses: [],
    yearLevels: [],
    sections: []
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load all data initially
  useEffect(() => {
    const loadAllData = async () => {
      const [coursesData, yearLevelsData, sectionsData] = await Promise.all([
        getAllCourses(),
        getAllYearLevels(),
        getAllSections()
      ]);
      setAllData({
        courses: coursesData,
        yearLevels: yearLevelsData,
        sections: sectionsData
      });
      setFilteredData({
        courses: coursesData,
        yearLevels: yearLevelsData,
        sections: sectionsData
      });
    };
    loadAllData();
  }, []);

  // Filter data when department changes
  useEffect(() => {
    const filterDataByDepartment = async () => {
      if (filters.department) {
        const departmentData = departments.find(d => d.departmentCode === filters.department);
        if (departmentData) {
          const [coursesData, yearLevelsData, sectionsData] = await Promise.all([
            getCoursesByDepartment(departmentData._id),
            getYearLevelsByDepartment(departmentData._id),
            getSectionsByDepartment(departmentData._id)
          ]);
          setFilteredData({
            courses: coursesData,
            yearLevels: yearLevelsData,
            sections: sectionsData
          });
        }
      } else {
        setFilteredData(allData);
      }
    };
    filterDataByDepartment();
  }, [filters.department, departments]);

  // Reset filters when department changes
  useEffect(() => {
    handleFilterChange('course', '');
  }, [filters.department]);

  useEffect(() => {
    handleFilterChange('yearLevel', '');
  }, [filters.course]);

  useEffect(() => {
    handleFilterChange('section', '');
  }, [filters.yearLevel]);

  if (!isMounted) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-9 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
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
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                neutral0: 'var(--bg-control, white)',
                neutral80: 'var(--text-primary, #111827)',
                neutral30: '#D1D5DB',
              },
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
          <ReactSelect
            value={filters.course ? { 
              value: filters.course, 
              label: `${filters.course} - ${filteredData.courses.find(c => c.courseCode === filters.course)?.courseTitle || ''}` 
            } : null}
            onChange={(option) => handleFilterChange('course', option?.value || '')}
            options={filteredData.courses.map(course => ({
              value: course.courseCode,
              label: `${course.courseCode} - ${course.courseTitle}`
            }))}
            isClearable
            placeholder="All Courses"
            styles={customSelectStyles}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                neutral0: 'var(--bg-control, white)',
                neutral80: 'var(--text-primary, #111827)',
                neutral30: '#D1D5DB',
              },
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level</label>
          <ReactSelect
            value={filters.yearLevel ? { 
              value: filters.yearLevel, 
              label: filters.yearLevel 
            } : null}
            onChange={(option) => handleFilterChange('yearLevel', option?.value || '')}
            options={filteredData.yearLevels.map(year => ({
              value: year,
              label: year
            }))}
            isClearable
            placeholder="All Year Levels"
            styles={customSelectStyles}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                neutral0: 'var(--bg-control, white)',
                neutral80: 'var(--text-primary, #111827)',
                neutral30: '#D1D5DB',
              },
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
          <ReactSelect
            value={filters.section ? { 
              value: filters.section, 
              label: filters.section 
            } : null}
            onChange={(option) => handleFilterChange('section', option?.value || '')}
            options={filteredData.sections.map(section => ({
              value: section,
              label: section
            }))}
            isClearable
            placeholder="All Sections"
            styles={customSelectStyles}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                neutral0: 'var(--bg-control, white)',
                neutral80: 'var(--text-primary, #111827)',
                neutral30: '#D1D5DB',
              },
            })}
          />
        </div>
      </div>
    </div>
  );
}
