'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';
import {
  PlusIcon,
  PrinterIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AssignSubjectModal from './_components/AssignSubjectModal';
import ViewSubjectModal from './_components/ViewSubjectModal';
import { getAssignments, deleteAssignment, getDepartments } from './/_actions';
import { useLoading } from '../../../context/LoadingContext';
import Filter from './_components/filter';
import ActionModal from './_components/ActionModal';

export default function AssignSubjectsPage() {
  const user = useAuthStore(state => state.user);
  const [assignments, setAssignments] = useState([]);
  const { isLoading, setIsLoading } = useLoading(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    yearLevel: '',
    section: '',
    course: '',
    department: '', // Changed from term to department
  });
  const [departments, setDepartments] = useState([]);

  // Mock active term data - replace with actual API call
  const activeTerm = {
    sy: '2024-2025',
    term: 1,
    termName: 'Term 1'
  };

  useEffect(() => {
    loadAssignments();
    loadDepartments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
      ActionModal.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleAssignSubject = async (formData) => {
    try {
      await loadAssignments();
      setEditingAssignment(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error handling assignment:', error);
      ActionModal.error('Failed to handle assignment');
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await ActionModal.confirmDelete();

      if (result.isConfirmed) {
        const response = await deleteAssignment(id, user?._id);
        if (response.success) {
          await loadAssignments(); // Reload the list
          ActionModal.success(response.message);
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      ActionModal.error(error.message || 'Failed to delete assignment');
    }
  };

  const handleEditClick = (assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleViewSubjects = (assignment) => {
    setViewingAssignment(assignment);
    setIsViewModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filters.yearLevel && assignment.yearLevel !== filters.yearLevel) return false;
    if (filters.section && assignment.classId?.sectionName !== filters.section) return false;
    if (filters.course && assignment.classId?.course?.courseCode !== filters.course) return false;
    if (filters.department && assignment.classId?.course?.department?.departmentCode !== filters.department) return false;
    return true;
  });

  // Get unique values for filters from assignments
  const filterOptions = {
    yearLevels: [...new Set(assignments.map(a => a.yearLevel))].sort(),
    sections: [...new Set(assignments.map(a => a.classId?.sectionName).filter(Boolean))].sort(),
    courses: [...new Set(assignments.map(a => a.classId?.course?.courseCode).filter(Boolean))].sort(),
    departments: departments.map(dept => dept.departmentCode).sort(),
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assigned Subjects</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and view all assigned subjects for {activeTerm.sy}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex sm:space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Assign New Subject
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Class Load
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <Filter 
          filters={filters}
          handleFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          departments={departments}
        />

        {/* Assignments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year Level
                  </th>
                  {/* Removed term column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View Subjects
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.yearLevel} Year
                    </td>
                    {/* Removed term column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.classId?.sectionName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.classId?.course?.courseCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewSubjects(assignment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Subjects"
                      >
                        <EyeIcon className="h-5 w-5 inline" aria-hidden="true" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button
                        onClick={() => handleEditClick(assignment)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Assignment"
                      >
                        <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Assignment"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AssignSubjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleAssignSubject}
        editData={editingAssignment}
        userId={user?._id}
      />

      <ViewSubjectModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingAssignment(null);
        }}
        assignment={viewingAssignment}
      />
    </div>
  );
}