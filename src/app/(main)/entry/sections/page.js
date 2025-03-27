'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { getSections, removeSection, getCourses } from './_actions';
import AddEditSectionModal from './_components/AddEditSectionModal';
import Swal from 'sweetalert2';
import Loading from '../../../components/Loading';
import { useLoading } from '../../../context/LoadingContext';
import useAuthStore from '@/store/useAuthStore';

export default function SectionsPage() {
  const user = useAuthStore((state) => state.user);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sectionsData, coursesData] = await Promise.all([
          getSections(),
          getCourses()
        ]);
        if (sectionsData.sections) {
          setSections(sectionsData.sections);
        } else if (sectionsData.error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: sectionsData.error
          });
        }
        if (coursesData.courses) {
          setCourses(coursesData.courses);
        } else if (coursesData.error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: coursesData.error
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load sections and courses'
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

  const handleDelete = async (sectionName) => {
    if (!user?._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User not authenticated'
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
        const response = await removeSection(sectionName, user._id);
        if (response.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Section has been deleted successfully.',
            confirmButtonColor: '#323E8F'
          });
          const sectionsData = await getSections();
          if (sectionsData.sections) {
            setSections(sectionsData.sections);
          } else if (sectionsData.error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: sectionsData.error
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.error || 'Failed to delete section',
            confirmButtonColor: '#323E8F'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete section',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (section) => {
    setSelectedSection(section);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedSection(null);
    setShowModal(true);
  };

  const sortedSections = useMemo(() => {
    if (!sortConfig.key) return sections;

    return [...sections].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for department sorting
      if (sortConfig.key === 'departmentCode') {
        aValue = getDepartmentCode(a);
        bValue = getDepartmentCode(b);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sections, sortConfig]);

  const filteredSections = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return sortedSections.filter(section => 
      section.sectionName.toLowerCase().includes(searchTermLower) ||
      section.course?.courseCode?.toLowerCase().includes(searchTermLower) ||
      section.course?.courseTitle?.toLowerCase().includes(searchTermLower) ||
      section.department?.departmentCode?.toLowerCase().includes(searchTermLower) ||
      section.yearLevel.toLowerCase().includes(searchTermLower)
    );
  }, [sortedSections, searchTerm]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Class Sections</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all class sections including their details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
          >
            Add Section
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4 flex items-center justify-between">
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
              className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
              placeholder="Search sections..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      <button
                        onClick={() => handleSort('sectionName')}
                        className="group inline-flex items-center"
                      >
                        Section Name
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('courseCode')}
                        className="group inline-flex items-center"
                      >
                        Course
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('departmentCode')}
                        className="group inline-flex items-center"
                      >
                        Department
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('yearLevel')}
                        className="group inline-flex items-center"
                      >
                        Year Level
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredSections.map((section) => (
                    <tr key={section.sectionName}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {section.sectionName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.course ? `${section.course.courseCode} - ${section.course.courseTitle}` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.department?.departmentCode || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.yearLevel}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(section)}
                          className="text-[#323E8F] hover:text-[#35408E] mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(section.sectionName)}
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
      </div>

      <AddEditSectionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        section={selectedSection}
        courses={courses}
        onSuccess={async () => {
          try {
            setIsLoading(true);
            const sectionsData = await getSections();
            if (sectionsData.sections) {
              setSections(sectionsData.sections);
              setShowModal(false);
            } else if (sectionsData.error) {
              throw new Error(sectionsData.error);
            }
          } catch (error) {
            console.error('Error refreshing sections:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to refresh sections'
            });
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
}