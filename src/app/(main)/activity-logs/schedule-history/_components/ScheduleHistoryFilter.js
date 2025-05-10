"use client"

import { useEffect } from "react";

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
  const academicYears = [...new Set(history.map(item => item.academicYear))].sort().reverse();

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
      <select
        value={selectedAcademicYear}
        onChange={(e) => {
          setSelectedAcademicYear(e.target.value);
        }}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      >
        <option key="all-years" value="">All Academic Years</option>
        {academicYears.map((year) => (
          <option key={`year-${year}`} value={year}>{year}</option>
        ))}
      </select>

      <select
        value={selectedDepartment}
        onChange={(e) => {
          setSelectedDepartment(e.target.value);
        }}
        disabled={isDean || isProgramChair}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
      >
        <option key="all-departments" value="">All Departments</option>
        {departments.map((dept) => (
          <option key={`dept-${dept._id}`} value={dept._id}>
            {dept.departmentName}
          </option>
        ))}
      </select>

      <select
        value={selectedCourse}
        onChange={(e) => {
          setSelectedCourse(e.target.value);
        }}
        disabled={isDean || isProgramChair}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
      >
        <option key="all-courses" value="">All Courses</option>
        {courses.map((course) => (
          <option key={`course-${course._id}`} value={course.courseCode}>
            {course.courseCode}
          </option>
        ))}
      </select>

      <select
        value={selectedTerm}
        onChange={(e) => {
          setSelectedTerm(e.target.value);
        }}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      >
        <option value="">All Terms</option>
        {activeTerms.map((term) => (
          <option key={`term-${term.id}`} value={term.id}>
            Term {term.term}
          </option>
        ))}
      </select>
    </div>
  );
}
