'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import AddEditRoomModal from './_components/AddEditRoomModal';
import { getRooms, getDepartments, removeRoom } from './_actions';
import Swal from 'sweetalert2';
import { useLoading } from '../../../context/LoadingContext';
import NoData from '@/app/components/NoData';
import useAuthStore from '../../../../store/useAuthStore';
import Filter from './_components/Filter';

export default function RoomsPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [filters, setFilters] = useState({
    department: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [roomsData, departmentsData] = await Promise.all([
          getRooms(),
          getDepartments()
        ]);
        if (roomsData.error) {
          throw new Error(roomsData.error);
        }
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }
        setRooms(roomsData.rooms || []);
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

  const sortedRooms = useMemo(() => {
    if (!sortConfig.key) return rooms;

    return [...rooms].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [rooms, sortConfig]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredRooms = useMemo(() => {
    return sortedRooms.filter((room) => {
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = (
        room.roomCode.toLowerCase().includes(searchString) ||
        room.roomName.toLowerCase().includes(searchString) ||
        room.type.toLowerCase().includes(searchString) ||
        room.floor.toLowerCase().includes(searchString)
      );

      const matchesDepartment = !filters.department || 
        room.department?.departmentCode === filters.department;

      return matchesSearch && matchesDepartment;
    });
  }, [sortedRooms, searchQuery, filters]);

  const handleDelete = async (roomCode) => {
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
        const response = await removeRoom(roomCode, user._id);
        if (response.error) {
          throw new Error(response.error);
        }
        setRooms(rooms.filter(room => room.roomCode !== roomCode));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Room has been deleted.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error deleting room:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete room',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedRoom(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const roomsData = await getRooms();
        if (roomsData.error) {
          throw new Error(roomsData.error);
        }
        setRooms(roomsData.rooms || []);
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
  };

  const getDepartmentName = (department) => {
    if (!department) return '';
    return `${department.departmentCode} - ${department.departmentName}`;
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Rooms</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              A list of all rooms in the system.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2 sm:w-auto"
            >
              Add Room
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] dark:focus:ring-[#4151B0] dark:bg-gray-800 sm:text-sm sm:leading-6"
                  placeholder="Search rooms..."
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-500"
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

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-opacity-20 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6 cursor-pointer"
                    onClick={() => handleSort('roomCode')}
                  >
                    Room Code {getSortIcon('roomCode')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('roomName')}
                  >
                    Room Name {getSortIcon('roomName')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('type')}
                  >
                    Type {getSortIcon('type')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('floor')}
                  >
                    Floor {getSortIcon('floor')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                  >
                    Department
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('capacity')}
                  >
                    Capacity {getSortIcon('capacity')}
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
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <NoData 
                        message={searchQuery ? "No matching rooms" : "No rooms yet"} 
                        description={searchQuery 
                          ? "Try adjusting your search term" 
                          : "Add a room to get started"
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.roomCode}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                        {room.roomCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {room.roomName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {room.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {room.floor}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {getDepartmentName(room.department)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {room.capacity}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(room)}
                          className="text-[#323E8F] hover:text-[#35408E] mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(room.roomCode)}
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

      <AddEditRoomModal
        show={showModal}
        onClose={handleModalClose}
        room={selectedRoom}
        departments={departments}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
