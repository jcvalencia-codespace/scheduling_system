'use client';

import { useState, useEffect } from 'react';
import { getUpdateHistory, getSubjectHistory, getSectionHistory, getRoomHistory, getActiveTerm } from './_actions';
import { useLoading } from '../../../context/LoadingContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ClassLoadHistory from './_components/ClassLoadHistory';
import SubjectHistory from './_components/SubjectHistory';
import SectionHistory from './_components/SectionHistory';
import RoomHistory from './_components/RoomHistory';
import HistoryFilter from './_components/HistoryFilter';
import useAuthStore from "@/store/useAuthStore";

export default function ArchivePage() {
  const [classHistory, setClassHistory] = useState([]);
  const [subjectHistory, setSubjectHistory] = useState([]);
  const [sectionHistory, setSectionHistory] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const { isLoading, setIsLoading } = useLoading();
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    showAllDates: false
  });
  const { user } = useAuthStore();
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    // Only run loadData if user is available
    if (user) {
      loadData();
    }
    
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('archiveFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
  }, [user]); // Only depend on user, not user.role or user.course

  const loadData = async () => {
    try {
      setIsLoading(true);
      const termData = await getActiveTerm();
      setActiveTerm(termData);

      // Add null check for user
      if (user?.role === 'Program Chair' && user?.course) {
        console.log('Program Chair Course Details:', {
          role: user.role,
          courseId: user.course,
          department: user.department,
          name: `${user.firstName} ${user.lastName}`
        });
        
        const classData = await getUpdateHistory(null, null, null, user.course);
        console.log('Class Load History Response:', {
          received: classData,
          count: Array.isArray(classData) ? classData.length : 0,
          courseFiltered: !!user.course
        });
        
        setClassHistory(Array.isArray(classData) ? classData : []);
      } else {
        // For other roles or when user data is not available
        const [classData, subjectData, sectionData, roomData] = await Promise.all([
          getUpdateHistory(),
          getSubjectHistory(),
          getSectionHistory(),
          getRoomHistory()
        ]);
        
        setClassHistory(Array.isArray(classData) ? classData : []);
        setSubjectHistory(Array.isArray(subjectData) ? subjectData : []);
        setSectionHistory(Array.isArray(sectionData) ? sectionData : []);
        setRoomHistory(Array.isArray(roomData) ? roomData : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (type, value) => {
    const newFilters = {
      ...filters,
      [type]: value
    };
    setFilters(newFilters);
    // Save filters to localStorage
    localStorage.setItem('archiveFilters', JSON.stringify(newFilters));
  };

  const handleFilterReset = () => {
    const resetFilters = {
      year: '',
      month: '',
      showAllDates: false
    };
    setFilters(resetFilters);
    localStorage.removeItem('archiveFilters');
  };

  const handleAccordionClick = (accordionId) => {
    setActiveAccordion(activeAccordion === accordionId ? null : accordionId);
  };

  // Add null check for user.role
  const isProgramChair = user?.role === 'Program Chair';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <div className="max-w-7xl mx-auto pb-20"> {/* Increased bottom padding */}
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">System Activity Log</h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
              View a comprehensive record of all system changes and user activities.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <HistoryFilter 
              onFilterChange={handleFilterChange} 
              initialFilters={filters}
              onReset={handleFilterReset}
            />
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Class Load History Dropdown - Always shown */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <button
              onClick={() => handleAccordionClick('classLoad')}
              className="w-full p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-left">Class Load Update History</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-left">View detailed history of all changes made to class load assignments</p>
              </div>
              {activeAccordion === 'classLoad' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            <div className={`transition-all duration-300 ease-in-out ${
              activeAccordion === 'classLoad' ? 'max-h-full opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              <ClassLoadHistory 
                history={classHistory} 
                filters={filters}
                activeTerm={activeTerm} 
              />
            </div>
          </div>

          {/* Other sections - Only shown if not Program Chair and user exists */}
          {user && !isProgramChair && (
            <>
              {/* Subjects History Dropdown */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <button
                  onClick={() => handleAccordionClick('subjects')}
                  className="w-full p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-left">Subject Update History</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-left">View detailed history of all changes made to subjects</p>
                  </div>
                  {activeAccordion === 'subjects' ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>

                <div className={`transition-all duration-300 ease-in-out ${
                  activeAccordion === 'subjects' ? 'max-h-full opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <SubjectHistory 
                    history={subjectHistory} 
                    filters={filters}
                    activeTerm={activeTerm}
                  />
                </div>
              </div>

              {/* Sections History Dropdown */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <button
                  onClick={() => handleAccordionClick('sections')}
                  className="w-full p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-left">Section Update History</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-left">View detailed history of all changes made to sections</p>
                  </div>
                  {activeAccordion === 'sections' ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>

                <div className={`transition-all duration-300 ease-in-out ${
                  activeAccordion === 'sections' ? 'max-h-full opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <SectionHistory 
                    history={sectionHistory} 
                    filters={filters}
                    activeTerm={activeTerm}
                  />
                </div>
              </div>

              {/* Rooms History Dropdown */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <button
                  onClick={() => handleAccordionClick('rooms')}
                  className="w-full p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-left">Room Update History</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-left">View detailed history of all changes made to rooms</p>
                  </div>
                  {activeAccordion === 'rooms' ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>

                <div className={`transition-all duration-300 ease-in-out ${
                  activeAccordion === 'rooms' ? 'max-h-full opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <RoomHistory 
                    history={roomHistory} 
                    filters={filters}
                    activeTerm={activeTerm}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
