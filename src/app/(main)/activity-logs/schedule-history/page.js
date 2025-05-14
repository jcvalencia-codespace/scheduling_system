"use client"

import { useState, useEffect } from "react";
import { getScheduleHistory } from "./_actions";
import ScheduleHistoryTable from "./_components/ScheduleHistoryTable";
import ScheduleHistoryFilter from "./_components/ScheduleHistoryFilter";
import { useLoading } from "@/app/context/LoadingContext";
import useAuthStore from "@/store/useAuthStore";
import { getDepartments } from '../../maintenance/departments/_actions';
import { getCourses } from '../../maintenance/courses/_actions';

export default function ScheduleHistoryPage() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const { user } = useAuthStore();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [activeTerms] = useState([
    { id: "1", term: "1" },
    { id: "2", term: "2" },
    { id: "3", term: "3" }
  ]);
  const [selectedTerm, setSelectedTerm] = useState("");

  useEffect(() => {
    // Only fetch data when user is available
    if (user) {
      fetchHistory();
      fetchDepartments();
      fetchAllCourses();
    }
  }, [user]); // Add user as dependency

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getScheduleHistory();
      if (response.error) throw new Error(response.error);
      setHistory(response);
      setFilteredHistory(response); // Initial set of filtered history
    } catch (error) {
      console.error("Error fetching schedule history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      if (!response.error) {
        if (user?.role === 'Dean' || user?.role === 'Program Chair') {
          const userDepartment = response.departments.find(d => d._id === user.department);
          setDepartments(userDepartment ? [userDepartment] : []);
          setSelectedDepartment(user.department || "");
        } else {
          setDepartments(response.departments);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchAllCourses = async () => {
    try {
      let response;
      
      if (!user) return;

      if (user.role === 'Program Chair' && user.department) {
        response = await getCourses(user.department);
        if (!response.error) {
          const programChairCourse = response.courses.find(c => c._id === user.course);
          if (programChairCourse) {
            setCourses([programChairCourse]);
            setSelectedCourse(programChairCourse.courseCode);
          }
        }
      } else if (user.role === 'Dean' && user.department) {
        response = await getCourses(user.department);
        if (!response.error) {
          setCourses(response.courses.filter(course => 
            course.department._id === user.department
          ));
        }
      } else {
        response = await getCourses();
        if (!response.error) {
          setCourses(response.courses);
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const applyFilters = () => {
    if (!history) return;
    
    const filtered = history.filter(item => {
      const matchesYear = !selectedAcademicYear || 
        item.academicYear === selectedAcademicYear;

      const matchesDept = !selectedDepartment || 
        item.scheduleDetails.sections.some(section => 
          section.department?.id === selectedDepartment);
            
      const matchesCourse = !selectedCourse || 
        item.scheduleDetails.sections.some(section => 
          section.course === selectedCourse);
        
      const matchesTerm = !selectedTerm || 
        (item.scheduleDetails.termNumber && item.scheduleDetails.termNumber.toString() === selectedTerm);
      
      return matchesYear && matchesDept && matchesCourse && matchesTerm;
    });
    
    setFilteredHistory(filtered);
  };

  // Add default values for user-dependent props
  const isDean = user?.role === 'Dean';
  const isProgramChair = user?.role === 'Program Chair';
  const userDepartment = user?.department || '';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Schedule History
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            View the history of schedule changes and updates.
          </p>
        </div>
      </div>

      <ScheduleHistoryFilter
        history={history}
        setFilteredHistory={setFilteredHistory}
        selectedAcademicYear={selectedAcademicYear}
        setSelectedAcademicYear={setSelectedAcademicYear}
        departments={departments}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        courses={courses}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        activeTerms={activeTerms}
        selectedTerm={selectedTerm}
        setSelectedTerm={setSelectedTerm}
        isDean={isDean}
        isProgramChair={isProgramChair}
        userDepartment={userDepartment}
      />

      <ScheduleHistoryTable
        history={filteredHistory}
        isLoading={isLoading}
        currentUser={user || {}}
      />
    </div>
  );
}