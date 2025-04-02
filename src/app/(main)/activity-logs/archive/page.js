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
    month: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const termData = await getActiveTerm();
        setActiveTerm(termData);

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
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('archiveFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
    
    loadData();
  }, []);

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
      month: ''
    };
    setFilters(resetFilters);
    localStorage.removeItem('archiveFilters');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Activity Log</h1>
            <p className="mt-2 text-base text-gray-600">
              View a comprehensive record of all system changes and user activities. Monitor updates, modifications, and actions performed within the system.
            </p>
          </div>
          <HistoryFilter 
            onFilterChange={handleFilterChange} 
            initialFilters={filters}
            onReset={handleFilterReset}
          />
        </div>

        <div className="space-y-6">
          {/* Class Load History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Class Load Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to class load assignments</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setExpandedRows(prev => ({ ...prev, classLoad: !prev.classLoad }))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  {expandedRows.classLoad ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {expandedRows.classLoad && (
              <ClassLoadHistory 
                history={classHistory} 
                filters={filters}
                activeTerm={activeTerm} 
              />
            )}
          </div>

          {/* Subjects History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Subject Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to subjects</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setExpandedRows(prev => ({ ...prev, subjects: !prev.subjects }))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  {expandedRows.subjects ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {expandedRows.subjects && (
              <SubjectHistory 
                history={subjectHistory} 
                filters={filters}
                activeTerm={activeTerm}
              />
            )}
          </div>

          {/* Sections History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Section Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to sections</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setExpandedRows(prev => ({ ...prev, sections: !prev.sections }))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  {expandedRows.sections ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {expandedRows.sections && (
              <SectionHistory 
                history={sectionHistory} 
                filters={filters}
                activeTerm={activeTerm}
              />
            )}
          </div>

          {/* Rooms History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Room Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to rooms</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setExpandedRows(prev => ({ ...prev, rooms: !prev.rooms }))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  {expandedRows.rooms ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {expandedRows.rooms && (
              <RoomHistory 
                history={roomHistory} 
                filters={filters}
                activeTerm={activeTerm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
