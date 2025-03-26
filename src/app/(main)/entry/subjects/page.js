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
import { getSubjects, removeSubject } from './_actions';
import AddEditSubjectForm from './_components/AddEditSubjectForm';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';

export default function SubjectsPage() {
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

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const [subjectsData] = await Promise.all([
        getSubjects()
      ]);
      setSubjects(subjectsData.subjects || []);
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

  const filteredSubjects = useMemo(() => {
    return sortedSubjects.filter((subject) => {
      const searchString = searchTerm.toLowerCase();
      const courseCode = subject.course?.courseCode || '';
      const courseTitle = subject.course?.courseTitle || '';
      
      return (
        subject.subjectCode.toLowerCase().includes(searchString) ||
        subject.subjectName.toLowerCase().includes(searchString) ||
        courseCode.toLowerCase().includes(searchString) ||
        courseTitle.toLowerCase().includes(searchString)
      );
    });
  }, [sortedSubjects, searchTerm]);

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubjects, currentPage]);

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const handleDelete = async (subjectCode) => {
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
        const response = await removeSubject(subjectCode);
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
    setSelectedSubject(null);
    setShowModal(true);
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
            <h1 className="text-xl font-semibold text-gray-900">Subjects</h1>
            <p className="mt-2 text-sm text-gray-700">
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                  placeholder="Search subjects..."
                />
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
                    onClick={() => handleSort('subjectCode')}
                  >
                    Subject Code {getSortIcon('subjectCode')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('subjectName')}
                  >
                    Subject Name {getSortIcon('subjectName')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Hours
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('course')}
                  >
                    Course {getSortIcon('course')}
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
                {paginatedSubjects.map((subject) => (
                  <tr key={subject.subjectCode}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {subject.subjectCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {subject.subjectName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {subject.lectureHours} / {subject.labHours}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {subject.course?.courseCode && subject.course?.courseTitle 
                        ? `${subject.course.courseCode} - ${subject.course.courseTitle}` 
                        : 'N/A'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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