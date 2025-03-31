'use client';

import { useState, useEffect } from 'react';
import { getUpdateHistory, getSubjectHistory, getSectionHistory, getRoomHistory } from './_actions';
import { useLoading } from '../../../context/LoadingContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ClassLoadHistory from './_components/ClassLoadHistory';
import SubjectHistory from './_components/SubjectHistory';
import SectionHistory from './_components/SectionHistory';
import RoomHistory from './_components/RoomHistory';

export default function ArchivePage() {
  const [classHistory, setClassHistory] = useState([]);
  const [subjectHistory, setSubjectHistory] = useState([]);
  const [sectionHistory, setSectionHistory] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    try {
      setIsLoading(true);
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
      console.error('Error loading histories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Activity Log</h1>
          <p className="mt-2 text-base text-gray-600">
            View a comprehensive record of all system changes and user activities. Monitor updates, modifications, and actions performed within the system.
          </p>
        </div>

        <div className="space-y-6">
          {/* Class Load History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRows(prev => ({ ...prev, classLoad: !prev.classLoad }))}
              className="w-full p-6 border-b border-gray-200 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Class Load Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to class load assignments</p>
              </div>
              {expandedRows.classLoad ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedRows.classLoad && (
              <ClassLoadHistory history={classHistory} />
            )}
          </div>

          {/* Subjects History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRows(prev => ({ ...prev, subjects: !prev.subjects }))}
              className="w-full p-6 border-b border-gray-200 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Subject Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to subjects</p>
              </div>
              {expandedRows.subjects ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedRows.subjects && (
              <SubjectHistory history={subjectHistory} />
            )}
          </div>

          {/* Sections History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRows(prev => ({ ...prev, sections: !prev.sections }))}
              className="w-full p-6 border-b border-gray-200 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Section Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to sections</p>
              </div>
              {expandedRows.sections ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedRows.sections && (
              <SectionHistory history={sectionHistory} />
            )}
          </div>

          {/* Rooms History Dropdown */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRows(prev => ({ ...prev, rooms: !prev.rooms }))}
              className="w-full p-6 border-b border-gray-200 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Room Update History</h2>
                <p className="mt-1 text-sm text-gray-500">View detailed history of all changes made to rooms</p>
              </div>
              {expandedRows.rooms ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedRows.rooms && (
              <RoomHistory history={roomHistory} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
