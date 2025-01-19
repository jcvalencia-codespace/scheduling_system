'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import AddDepartmentModal from './_components/AddDepartmentModal';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function DepartmentsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  // Sample data - replace with actual data fetching
  const departments = [
    {
      id: 1,
      code: 'CCS',
      name: 'College of Computing Studies',
      dean: 'Dr. John Smith',
      location: 'IT Building',
      courses: ['BSCS', 'BSIT', 'BSIS'],
      status: 'Active',
    },
    {
      id: 2,
      code: 'COE',
      name: 'College of Engineering',
      dean: 'Dr. Jane Doe',
      location: 'Engineering Building',
      courses: ['BSCE', 'BSEE', 'BSME'],
      status: 'Active',
    },
    // Add more sample data as needed
  ];

  // Sorting function
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

  // Filtering function
  const filteredDepartments = useMemo(() => {
    return sortedDepartments.filter((department) =>
      Object.values(department).some(
        (value) =>
          value &&
          (typeof value === 'string'
            ? value.toLowerCase().includes(searchQuery.toLowerCase())
            : Array.isArray(value)
            ? value.some((v) =>
                v.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : false)
      )
    );
  }, [sortedDepartments, searchQuery]);

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
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all departments in the university including their details and courses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
          >
            Add Department
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
              placeholder="Search departments..."
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
                        Department Code
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
                        onClick={() => handleSort('name')}
                        className="group inline-flex"
                      >
                        Name
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
                      Dean
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Courses
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
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
                  {filteredDepartments.map((department) => (
                    <tr key={department.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {department.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {department.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {department.dean}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {department.location}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {department.courses.map((course) => (
                            <span
                              key={course}
                              className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            department.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {department.status}
                        </span>
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

      {/* Add Department Modal */}
      <AddDepartmentModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        title="Add New Department"
      >
        <form className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Department Code
            </label>
            <input
              type="text"
              name="code"
              id="code"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., CCS"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Department Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., College of Computing Studies"
            />
          </div>

          <div>
            <label
              htmlFor="dean"
              className="block text-sm font-medium text-gray-700"
            >
              Dean
            </label>
            <input
              type="text"
              name="dean"
              id="dean"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="e.g., Dr. John Smith"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <select
              id="location"
              name="location"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
            >
              <option value="">Select a location</option>
              <option value="Main Building">Main Building</option>
              <option value="IT Building">IT Building</option>
              <option value="Engineering Building">Engineering Building</option>
              <option value="Science Building">Science Building</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
              placeholder="Enter department description..."
            />
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#323E8F] sm:col-start-2"
            >
              Add Department
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
      </AddDepartmentModal>
    </div>
  );
}