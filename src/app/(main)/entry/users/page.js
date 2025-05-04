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
import { getUsers, removeUser } from './_actions';
import AddEditUserModal from './_components/AddEditUserModal';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersData = await getUsers();
        if (usersData.error) {
          throw new Error(usersData.error);
        }
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load users'
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

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return users;

    return [...users].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortConfig]);

  const handleDelete = async (userId) => {
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
        const response = await removeUser(userId);
        if (response.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'User has been deleted successfully.',
            confirmButtonColor: '#323E8F'
          });
          const fetchData = async () => {
            setIsLoading(true);
            try {
              const usersData = await getUsers();
              if (usersData.error) {
                throw new Error(usersData.error);
              }
              setUsers(usersData.users || []);
            } catch (error) {
              console.error('Error fetching data:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load users'
              });
            } finally {
              setIsLoading(false);
            }
          };
          fetchData();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.error || 'Failed to delete user',
            confirmButtonColor: '#323E8F'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete user',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (user) => {
    // user object should already have populated department and course from getAllUsers
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const formatEmploymentType = (type) => {
    return type === 'full-time' ? 'Full-Time' : 'Part-Time';
  };

  const filteredUsers = sortedUsers.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the system including their details and roles.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
          >
            Add User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search users..."
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      <button
                        onClick={() => handleSort('lastName')}
                        className="group inline-flex items-center"
                      >
                        Name
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('email')}
                        className="group inline-flex items-center"
                      >
                        Email
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('role')}
                        className="group inline-flex items-center"
                      >
                        Role
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('department')}
                        className="group inline-flex items-center"
                      >
                        Department
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('course')}
                        className="group inline-flex items-center"
                      >
                        Course
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => handleSort('employmentType')}
                        className="group inline-flex items-center"
                      >
                        Type
                        <ChevronUpDownIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </button>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.firstName} {user.middleName} {user.lastName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.role}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.department?.departmentCode || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.course?.courseCode || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatEmploymentType(user.employmentType)}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(user)}
                          className="inline-flex text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="inline-flex ml-4 text-red-600 hover:text-red-900"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      <AddEditUserModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          setShowModal(false);
          setSelectedUser(null);
          const fetchData = async () => {
            setIsLoading(true);
            try {
              const usersData = await getUsers();
              if (usersData.error) {
                throw new Error(usersData.error);
              }
              setUsers(usersData.users || []);
            } catch (error) {
              console.error('Error fetching data:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load users'
              });
            } finally {
              setIsLoading(false);
            }
          };
          fetchData();
        }}
      />
    </div>
  );
}