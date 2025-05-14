'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import AddEditCourseModal from './_components/AddEditCourseModal';
import { getCourses, removeCourse, getDepartments } from './_actions';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';
import NoData from '@/app/components/NoData';
import Filter from './_components/Filter';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [filters, setFilters] = useState({
    department: '',
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, departmentsData] = await Promise.all([
          getCourses(),
          getDepartments()
        ]);

        if (coursesData.error) {
          throw new Error(coursesData.error);
        }
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }

        setCourses(coursesData.courses || []);
        setDepartments(departmentsData.departments || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load data',
          confirmButtonColor: '#323E8F'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedCourses = useMemo(() => {
    if (!sortConfig.key) return courses;

    return [...courses].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [courses, sortConfig]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredCourses = useMemo(() => {
    return sortedCourses.filter((course) => {
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        course.courseCode.toLowerCase().includes(searchString) ||
        course.courseTitle.toLowerCase().includes(searchString) ||
        course.department?.departmentCode?.toLowerCase().includes(searchString) ||
        course.department?.departmentName?.toLowerCase().includes(searchString);

      const matchesDepartment = !filters.department || 
        course.department?.departmentCode === filters.department;

      return matchesSearch && matchesDepartment;
    });
  }, [sortedCourses, searchQuery, filters]);

  const handleDelete = async (courseCode) => {
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
        const response = await removeCourse(courseCode);
        if (response.error) {
          throw new Error(response.error);
        }
        setCourses(courses.filter(course => course.courseCode !== courseCode));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Course has been deleted.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error deleting course:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete course',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedCourse(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedCourse(null);
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const result = await getCourses();
        if (result.error) {
          throw new Error(result.error);
        }
        setCourses(result.courses || []);
      } catch (error) {
        console.error('Error loading courses:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load courses',
          confirmButtonColor: '#323E8F'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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
            <h1 className="text-xl font-semibold text-gray-900">Courses</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all courses in the system.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
            >
              Add Course
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
                  placeholder="Search courses..."
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
            <Filter 
              filters={filters}
              handleFilterChange={handleFilterChange}
              departments={departments}
            />
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                    onClick={() => handleSort('courseCode')}
                  >
                    Course Code {getSortIcon('courseCode')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('courseTitle')}
                  >
                    Course Title {getSortIcon('courseTitle')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('departmentCode')}
                  >
                    Department {getSortIcon('departmentCode')}
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
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <NoData 
                        message={searchQuery ? "No matching courses" : "No courses yet"} 
                        description={searchQuery 
                          ? "Try adjusting your search term" 
                          : "Add a course to get started"
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.courseCode}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {course.courseCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {course.courseTitle}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {course.department?.departmentCode}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-[#323E8F] hover:text-[#35408E] mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(course.courseCode)}
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

      <AddEditCourseModal
        show={showModal}
        onClose={handleModalClose}
        course={selectedCourse}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}