'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import AddSectionModal from './_components/AddSectionModal';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function SectionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  // Sample data - replace with actual data fetching
  const sections = [
    {
      id: 1,
      code: 'BSCS-1A',
      program: 'BS Computer Science',
      yearLevel: '1st Year',
      semester: '1st Semester',
      academicYear: '2024-2025',
      adviser: 'John Smith',
      maxStudents: 40,
      currentStudents: 35,
    },
    {
      id: 2,
      code: 'BSIT-2B',
      program: 'BS Information Technology',
      yearLevel: '2nd Year',
      semester: '1st Semester',
      academicYear: '2024-2025',
      adviser: 'Jane Doe',
      maxStudents: 40,
      currentStudents: 38,
    },
    // Add more sample data as needed
  ];

  // Sorting function
  const sortedSections = useMemo(() => {
    if (!sortConfig.key) return sections;

    return [...sections].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sections, sortConfig]);

  // Filtering function
  const filteredSections = useMemo(() => {
    return sortedSections.filter((section) =>
      Object.values(section).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [sortedSections, searchQuery]);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Class Sections</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all class sections including their details, advisers, and student count.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <button
                        onClick={() => handleSort('code')}
                        className="group inline-flex"
                      >
                        Section Code
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ChevronUpDownIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <button
                        onClick={() => handleSort('program')}
                        className="group inline-flex"
                      >
                        Program
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ChevronUpDownIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Year Level
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Semester
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Academic Year
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Adviser
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Students
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
                  {filteredSections.map((section) => (
                    <tr key={section.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {section.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.program}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.yearLevel}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.semester}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.academicYear}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.adviser}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {section.currentStudents}/{section.maxStudents}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          className="text-[#323E8F] hover:text-[#35408E] mr-4"
                          onClick={() => {
                            // Handle edit
                          }}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            // Handle delete
                          }}
                        >
                          <TrashIcon className="h-5 w-5" />
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

      {/* Add Section Modal */}
      <AddSectionModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        title="Add New Section"
      >
        <form className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Section Code
            </label>
            <input
              type="text"
              name="code"
              id="code"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., BSCS-1A"
            />
          </div>

          <div>
            <label
              htmlFor="program"
              className="block text-sm font-medium text-gray-700"
            >
              Program
            </label>
            <select
              id="program"
              name="program"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
            >
              <option value="">Select a program</option>
              <option value="BS Computer Science">BS Computer Science</option>
              <option value="BS Information Technology">BS Information Technology</option>
              <option value="BS Information Systems">BS Information Systems</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="yearLevel"
              className="block text-sm font-medium text-gray-700"
            >
              Year Level
            </label>
            <select
              id="yearLevel"
              name="yearLevel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
            >
              <option value="">Select a year level</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="semester"
              className="block text-sm font-medium text-gray-700"
            >
              Semester
            </label>
            <select
              id="semester"
              name="semester"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
            >
              <option value="">Select a semester</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="academicYear"
              className="block text-sm font-medium text-gray-700"
            >
              Academic Year
            </label>
            <input
              type="text"
              name="academicYear"
              id="academicYear"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., 2024-2025"
            />
          </div>

          <div>
            <label
              htmlFor="adviser"
              className="block text-sm font-medium text-gray-700"
            >
              Adviser
            </label>
            <select
              id="adviser"
              name="adviser"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
            >
              <option value="">Select an adviser</option>
              <option value="John Smith">John Smith</option>
              <option value="Jane Doe">Jane Doe</option>
              {/* Add more advisers */}
            </select>
          </div>

          <div>
            <label
              htmlFor="maxStudents"
              className="block text-sm font-medium text-gray-700"
            >
              Maximum Students
            </label>
            <input
              type="number"
              name="maxStudents"
              id="maxStudents"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., 40"
            />
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#323E8F] sm:col-start-2"
            >
              Add Section
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </AddSectionModal>
    </div>
  );
}