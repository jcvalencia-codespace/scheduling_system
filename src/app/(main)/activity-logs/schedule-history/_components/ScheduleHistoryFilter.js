"use client"

import { useEffect } from "react";
import Select from 'react-select';

export default function ScheduleHistoryFilter({
  history,
  setFilteredHistory,
  selectedAcademicYear,
  setSelectedAcademicYear,
  departments,
  selectedDepartment,
  setSelectedDepartment,
  courses,
  selectedCourse,
  setSelectedCourse,
  activeTerms,
  selectedTerm,
  setSelectedTerm,
  isDean,
  isProgramChair,
  userDepartment
}) {
  const academicYears = [...new Set(history.map(item => item.academicYear))]
    .sort()
    .reverse()
    .map(year => ({ value: year, label: year }));

  const departmentOptions = departments.map(dept => ({
    value: dept._id,
    label: dept.departmentName
  }));

  const courseOptions = courses.map(course => ({
    value: course.courseCode,
    label: course.courseCode
  }));

  const termOptions = [
    { value: '', label: 'All Terms' },
    ...activeTerms.map(term => ({
      value: term.id,
      label: `Term ${term.term}`
    }))
  ];

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'white',
      borderColor: '#E5E7EB',
      '&:hover': {
        borderColor: '#6366F1'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'white',
      zIndex: 50
    })
  };

  const handleFilter = () => {
    console.log('Filter values:', {
      selectedTerm,
      historyTerms: history.map(item => ({
        term: item.scheduleDetails.term,
        termNumber: item.scheduleDetails.termNumber
      }))
    });

    const filtered = history.filter(item => {
      const matchesYear = !selectedAcademicYear || 
        item.academicYear === selectedAcademicYear;

      const matchesDept = !selectedDepartment || 
        item.scheduleDetails.sections.some(section => 
          section.department?.id === selectedDepartment);

      const matchesCourse = !selectedCourse || 
        item.scheduleDetails.sections.some(section => 
          section.course === selectedCourse);

      // Extract just the number from "Term X" format
      const itemTermNumber = item.scheduleDetails.term?.replace('Term ', '') || null;
      
      const matchesTerm = !selectedTerm || 
        itemTermNumber === selectedTerm;

      console.log('Term matching:', {
        selectedTerm,
        itemTerm: item.scheduleDetails.term,
        itemTermNumber,
        matches: matchesTerm
      });

      return matchesYear && matchesDept && matchesCourse && matchesTerm;
    });

    console.log('Filtered results:', {
      total: history.length,
      filtered: filtered.length,
      selectedTerm
    });

    setFilteredHistory(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [selectedAcademicYear, selectedDepartment, selectedCourse, selectedTerm]);

  return (
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-black">
      <Select
        value={selectedAcademicYear ? { value: selectedAcademicYear, label: selectedAcademicYear } : null}
        onChange={(option) => setSelectedAcademicYear(option ? option.value : '')}
        options={[{ value: '', label: 'All Academic Years' }, ...academicYears]}
        isClearable
        placeholder="Select Academic Year"
        styles={customStyles}
      />

      <Select
        value={selectedDepartment ? departmentOptions.find(opt => opt.value === selectedDepartment) : null}
        onChange={(option) => setSelectedDepartment(option ? option.value : '')}
        options={[{ value: '', label: 'All Departments' }, ...departmentOptions]}
        isDisabled={isDean || isProgramChair}
        isClearable
        placeholder="Select Department"
        styles={customStyles}
      />

      <Select
        value={selectedCourse ? courseOptions.find(opt => opt.value === selectedCourse) : null}
        onChange={(option) => setSelectedCourse(option ? option.value : '')}
        options={[{ value: '', label: 'All Courses' }, ...courseOptions]}
        isDisabled={isProgramChair}
        isClearable
        placeholder="Select Course"
        styles={customStyles}
      />

      <Select
        value={selectedTerm ? termOptions.find(opt => opt.value === selectedTerm) : null}
        onChange={(option) => setSelectedTerm(option ? option.value : '')}
        options={termOptions}
        isClearable
        placeholder="Select Term"
        styles={customStyles}
      />
    </div>
  );
}