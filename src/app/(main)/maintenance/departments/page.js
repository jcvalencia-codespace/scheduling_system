'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import AddEditDepartmentModal from './_components/AddEditDepartmentModal';
import ViewCourses from './_components/ViewCourses';
import { getDepartments, removeDepartment, getCoursesByDepartment } from './_actions';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';
import NoData from '@/app/components/NoData';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [departmentCourses, setDepartmentCourses] = useState({});
  const [showViewCourses, setShowViewCourses] = useState(false);
  const [selectedViewDepartment, setSelectedViewDepartment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const departmentsData = await getDepartments();
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }
        setDepartments(departmentsData.departments || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load departments',
          confirmButtonColor: '#323E8F'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  useEffect(() => {
    // Load courses for all departments when departments are loaded
    departments.forEach(dept => {
      if (!departmentCourses[dept.departmentCode]) {
        loadDepartmentCourses(dept.departmentCode);
      }
    });
  }, [departments]);

  const loadDepartmentCourses = async (departmentCode) => {
    try {
      const result = await getCoursesByDepartment(departmentCode);
      if (result.error) {
        throw new Error(result.error);
      }
      setDepartmentCourses(prev => ({
        ...prev,
        [departmentCode]: result.courses || []
      }));
    } catch (error) {
      console.error('Error loading department courses:', error);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedDepartments = useMemo(() => {
    if (!sortConfig.key) return departments;

    return [...departments].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [departments, sortConfig]);

  const filteredDepartments = useMemo(() => {
    return sortedDepartments.filter((department) => {
      const searchString = searchQuery.toLowerCase();
      return (
        department.departmentCode.toLowerCase().includes(searchString) ||
        department.departmentName.toLowerCase().includes(searchString)
      );
    });
  }, [sortedDepartments, searchQuery]);

  const handleDelete = async (departmentCode) => {
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
        const response = await removeDepartment(departmentCode);
        if (response.error) {
          throw new Error(response.error);
        }
        setIsLoading(true);
        const departmentsData = await getDepartments();
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }
        setDepartments(departmentsData.departments || []);
        setIsLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Department has been deleted.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error deleting department:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete department',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDepartment(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedDepartment(null);
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const departmentsData = await getDepartments();
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }
        setDepartments(departmentsData.departments || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load departments',
          confirmButtonColor: '#323E8F'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  };

  const handleViewCourses = (department) => {
    setSelectedViewDepartment(department);
    setShowViewCourses(true);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return (
        <ChevronUpDownIcon
          className={`h-4 w-4 inline-block ml-1 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''
            }`}
        />
      );
    }
    return <ChevronUpDownIcon className="h-4 w-4 inline-block ml-1" />;
  };

  const getCoursesDisplay = (departmentCode) => {
    const courses = departmentCourses[departmentCode] || [];
    return courses.length > 0
      ? courses.map(course => course.courseCode || course.courseTitle).join(', ')
      : 'No courses';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all departments in the system.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
            >
              Add Department
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="flex-1 max-w-sm">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                  placeholder="Search departments..."
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                    onClick={() => handleSort('departmentCode')}
                  >
                    Department Code {getSortIcon('departmentCode')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('departmentName')}
                  >
                    Department Name {getSortIcon('departmentName')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-center text-sm font-semibold justify-center text-gray-900"
                  >
                    Courses
                  </th>
                  <th
                    scope="col"
                    className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <NoData 
                        message={searchQuery ? "No matching departments" : "No departments yet"} 
                        description={searchQuery 
                          ? "Try adjusting your search term" 
                          : "Add a department to get started"
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((department) => (
                    <tr key={department.departmentCode}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {department.departmentCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {department.departmentName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleViewCourses(department)}
                            className="text-[#323E8F] hover:text-[#35408E]"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(department)}
                          className="text-[#323E8F] hover:text-[#35408E] mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(department.departmentCode)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddEditDepartmentModal
        show={showModal}
        onClose={handleModalClose}
        department={selectedDepartment}
        onSuccess={handleModalSuccess}
      />

      <ViewCourses
        show={showViewCourses}
        onClose={() => setShowViewCourses(false)}
        department={selectedViewDepartment}
        courses={selectedViewDepartment ? departmentCourses[selectedViewDepartment.departmentCode] : []}
      />
    </div>
  );
}