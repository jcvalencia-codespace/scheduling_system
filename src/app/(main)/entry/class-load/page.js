'use client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
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
import { getAssignments, deleteAssignment, getDepartments, getActiveTerm, getSubjectAssignments } from './_actions';
import { useLoading } from '../../../context/LoadingContext';
import Filter from './_components/filter';
import ActionModal from './_components/ActionModal';
import PrintModal from './_components/printModal';
import { generateClassLoadPDF } from './_components/classLoadPdf';
import Pagination from './_components/Pagination';
import NoData from '@/app/components/NoData';

// Create a client
const queryClient = new QueryClient();

// Wrap the main component with QueryClientProvider
function AssignSubjectsPageContent() {
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages (optional)
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadAssignments(),
        loadDepartments(),
        loadActiveTerm()
      ]);
    };
    init();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getAssignments(user?._id);
      if (Array.isArray(data)) {
        setAssignments(data);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      ActionModal.error('Failed to load assignments');
      setAssignments([]);
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

  const loadActiveTerm = async () => {
    try {
      setIsTermLoading(true);
      const { term } = await getActiveTerm();
      setActiveTerm(term);
    } catch (error) {
      console.error('Error loading active term:', error);
      // Fallback to default term if action fails
      setActiveTerm({
        sy: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        term: 1,
        termName: 'Term 1'
      });
    } finally {
      setIsTermLoading(false);
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

  const canEditAssignment = (assignment) => {
    if (!user) return false;
    
    // Admin can edit all assignments
    if (user.role?.toLowerCase() === 'administrator') return true;
    
    // For Program Chair
    if (user.role?.toLowerCase() === 'program chair') {
      const userCourseId = user.course?.toString();
      const assignmentCourseId = assignment.classId?.course?._id?.toString();
      return userCourseId === assignmentCourseId;
    }
    
    // For Dean
    if (user.role?.toLowerCase() === 'dean') {
      const userDepartmentId = user.department?.toString();
      const assignmentDepartmentId = assignment.classId?.course?.department?._id?.toString();
      return userDepartmentId === assignmentDepartmentId;
    }
    
    return false;
  };

  const filteredAssignments = assignments.filter(assignment => {
    // Department filter
    if (filters.department && 
        assignment.classId?.course?.department?.departmentCode !== filters.department) {
      return false;
    }

    // Course filter - only apply if department matches or no department selected
    if (filters.course && 
        assignment.classId?.course?.courseCode !== filters.course) {
      return false;
    }

    // Year Level filter - only apply if course matches or no course selected
    if (filters.yearLevel && 
        !assignment.yearLevel?.toLowerCase().includes(filters.yearLevel.toLowerCase().replace(' year', ''))) {
      return false;
    }

    // Section filter - only apply if year level matches or no year level selected
    if (filters.section && 
        assignment.classId?.sectionName !== filters.section) {
      return false;
    }

    return true;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssignments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage); // Add this line

  // Update filterOptions based on department selection
  const filterOptions = {
    yearLevels: [...new Set(assignments
      .filter(a => !filters.department || a.classId?.course?.department?.departmentCode === filters.department)
      .map(a => a.yearLevel + ' Year'))].sort(),
    sections: [...new Set(assignments
      .filter(a => {
        if (filters.department && a.classId?.course?.department?.departmentCode !== filters.department) return false;
        if (filters.course && a.classId?.course?.courseCode !== filters.course) return false;
        if (filters.yearLevel && !a.yearLevel?.toLowerCase().includes(filters.yearLevel.toLowerCase().replace(' year', ''))) return false;
        return true;
      })
      .map(a => a.classId?.sectionName)
      .filter(Boolean))].sort(),
    courses: [...new Set(assignments
      .filter(a => !filters.department || a.classId?.course?.department?.departmentCode === filters.department)
      .map(a => a.classId?.course?.courseCode)
      .filter(Boolean))].sort()
  };

  // Get unique courses from assignments with proper deduplication
  const uniqueCourses = [...new Set(assignments
    .map(a => a.classId?.course?.courseCode)
    .filter(Boolean))]
    .map(courseCode => {
      const course = assignments.find(a => a.classId?.course?.courseCode === courseCode)?.classId?.course;
      return {
        courseCode: course.courseCode,
        courseTitle: course.courseTitle
      };
    });

  const handlePrint = async (selectedCourse, selectedTerm, isPreview = false) => {
    try {
      const doc = await generateClassLoadPDF(assignments, selectedCourse, selectedTerm);
      if (doc) {
        if (isPreview) {
          return doc;
        } else {
          doc.save(`class-load-${selectedCourse.courseCode}-${selectedTerm.sy}-Term${selectedTerm.term}.pdf`);
          setIsPrintModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Error printing:', error);
      ActionModal.error('Failed to generate PDF');
    }
  };

  // Update the query to include userId
  const { data: subjectAssignments = [] } = useQuery({
    queryKey: ['subjectAssignments', user?._id],
    queryFn: async () => {
      const { success, assignments } = await getSubjectAssignments(user?._id);
      if (success) return assignments;
      return [];
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Assigned Subjects</h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage and view all assigned subjects for {activeTerm?.sy || 'Current Academic Year'} - All Terms
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 sm:space-x-3">
            {/* Allow all roles to assign subjects */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Assign New Subject
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
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

        {/* Assignments Table - Mobile Responsive */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="hidden sm:block">
              {/* Desktop Table */}
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Year Level
                    </th>
                    {/* Removed term column */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      View Subjects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <NoData 
                          message="No assignments found" 
                          description="Add an assignment to get started"
                        />
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((assignment) => (
                      <tr key={assignment._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {assignment.yearLevel} Year
                        </td>
                        {/* Removed term column */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {assignment.classId?.sectionName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
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
                          {canEditAssignment(assignment) && (
                            <>
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
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Replace the old pagination controls with the new component */}
              {filteredAssignments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredAssignments.length}
                  itemsPerPage={itemsPerPage}
                  startIndex={indexOfFirstItem}
                  endIndex={indexOfLastItem}
                />
              )}
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden">
              {currentItems.map((assignment) => (
                <div key={assignment._id} className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-200">{assignment.yearLevel} Year</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{assignment.classId?.sectionName || 'N/A'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{assignment.classId?.course?.courseCode || 'N/A'}</div>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleViewSubjects(assignment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Subjects"
                      >
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {canEditAssignment(assignment) && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {currentItems.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No assignments found
                </div>
              )}
            </div>
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

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        courses={uniqueCourses}
        onPrint={handlePrint}
        assignments={subjectAssignments} // Pass the assignments data
        activeTerm={activeTerm}
        isTermLoading={isTermLoading}
      />
    </div>
  );
}

// Export the wrapped component
export default function AssignSubjectsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AssignSubjectsPageContent />
    </QueryClientProvider>
  );
}