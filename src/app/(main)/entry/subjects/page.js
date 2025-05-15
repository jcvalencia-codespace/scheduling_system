'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { getSubjects, removeSubject } from './_actions';
import AddEditSubjectForm from './_components/AddEditSubjectForm';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';
import useAuthStore from '@/store/useAuthStore';
import Filter from './_components/filter';
import NoData from '@/app/components/NoData';

export default function SubjectsPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    department: '',
  });

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await getSubjects();
      if (response.error) {
        throw new Error(response.error);
      }
      setSubjects(response.subjects || []);
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedSubjects = useMemo(() => {
    if (!sortConfig.key) return subjects;

    return [...subjects].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [subjects, sortConfig]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredSubjects = useMemo(() => {
    return sortedSubjects.filter((subject) => {
      const searchString = searchTerm.toLowerCase();
      const departmentCode = subject.department?.departmentCode || '';
      const departmentName = subject.department?.departmentName || '';
      
      const matchesSearch = 
        subject.subjectCode.toLowerCase().includes(searchString) ||
        subject.subjectName.toLowerCase().includes(searchString) ||
        departmentCode.toLowerCase().includes(searchString) ||
        departmentName.toLowerCase().includes(searchString);

      const matchesDepartment = !filters.department || subject.department?.departmentCode === filters.department;

      return matchesSearch && matchesDepartment;
    });
  }, [sortedSubjects, searchTerm, filters]);

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubjects, currentPage]);

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const handleDelete = async (subjectCode) => {
    if (!user || !user._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'You must be logged in to perform this action',
        confirmButtonColor: '#323E8F'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#323E8F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await removeSubject(subjectCode, user._id);
        if (response.error) {
          throw new Error(response.error);
        }
        setSubjects(subjects.filter(subject => subject.subjectCode !== subjectCode));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Subject has been deleted.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error deleting subject:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete subject',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
  };

  const handleAdd = () => {
    const existingSubject = subjects.find(s => !s.isActive);
    if (existingSubject) {
      // If there's an inactive subject, ask if they want to reactivate it
      Swal.fire({
        title: 'Subject exists',
        text: 'This subject code was previously deactivated. Would you like to reactivate it?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#323E8F',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reactivate'
      }).then((result) => {
        if (result.isConfirmed) {
          // Handle reactivation through the form component
          setSelectedSubject({...existingSubject, isActive: true, updateHistory: 'updated'});
          setShowModal(true);
        }
      });
    } else {
      setSelectedSubject(null);
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedSubject(null);
    fetchSubjects(); // Reuse the fetchSubjects function to refresh data
  };

  const canEditSubject = (subject) => {
    if (!user) return false;
    if (user.role?.toLowerCase() === 'administrator') return true;
    if (user.role?.toLowerCase() === 'dean') {
      return user.department === subject.department?._id;
    }
    return false;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return (
        <ChevronUpDownIcon
          className={`h-4 w-4 inline-block ml-1 ${
            sortConfig.direction === 'asc' ? 'transform rotate-180' : ''
          }`}
        />
      );
    }
    return <ChevronUpDownIcon className="h-4 w-4 inline-block ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Subjects</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              A list of all subjects in the system.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
            >
              Add Subject
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="flex-1 max-w-sm">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] dark:focus:ring-[#4151B0] dark:bg-gray-800 sm:text-sm sm:leading-6"
                  placeholder="Search subjects..."
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Filter 
            filters={filters}
            handleFilterChange={handleFilterChange}
            departments={departments}
          />

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-opacity-10 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6 cursor-pointer"
                          onClick={() => handleSort('subjectCode')}
                        >
                          Subject Code {getSortIcon('subjectCode')}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                          onClick={() => handleSort('subjectName')}
                        >
                          Subject Name {getSortIcon('subjectName')}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                          onClick={() => handleSort('department')}
                        >
                          Department {getSortIcon('department')}
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {filteredSubjects.length === 0 ? (
                        <tr>
                          <td colSpan="4">
                            <NoData 
                              message={searchTerm ? "No matching subjects" : "No subjects yet"} 
                              description={searchTerm 
                                ? "Try adjusting your search term" 
                                : "Add a subject to get started"
                              }
                            />
                          </td>
                        </tr>
                      ) : (
                        paginatedSubjects.map((subject) => (
                          <tr key={subject.subjectCode}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                              {subject.subjectCode}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {subject.subjectName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {subject.department?.departmentCode && subject.department?.departmentName 
                                ? `${subject.department.departmentCode}` 
                                : 'N/A'}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {canEditSubject(subject) && (
                                <>
                                  <button
                                    onClick={() => handleEdit(subject)}
                                    className="text-[#323E8F] hover:text-[#35408E] mr-4"
                                  >
                                    <PencilSquareIcon className="h-5 w-5" />
                                    <span className="sr-only">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(subject.subjectCode)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                    <span className="sr-only">Delete</span>
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden">
            <div className="space-y-4">
              {paginatedSubjects.map((subject) => (
                <div 
                  key={subject.subjectCode}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      {subject.subjectCode}
                    </div>
                    <div className="flex space-x-2">
                      {canEditSubject(subject) && (
                        <>
                          <button
                            onClick={() => handleEdit(subject)}
                            className="text-[#323E8F] hover:text-[#35408E]"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.subjectCode)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p><span className="font-medium dark:text-gray-300">Name:</span> {subject.subjectName}</p>
                    <p>
                      <span className="font-medium dark:text-gray-300">Department:</span>{' '}
                      {subject.department?.departmentCode && subject.department?.departmentName 
                        ? `${subject.department.departmentCode}` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddEditSubjectForm
        show={showModal}
        onClose={handleModalClose}
        subject={selectedSubject}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}