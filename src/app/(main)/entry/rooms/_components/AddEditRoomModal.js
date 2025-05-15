'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addRoom, editRoom } from '../_actions';
import Swal from 'sweetalert2';
import useAuthStore from '../../../../../store/useAuthStore';
import Select from 'react-select';
import RoomModalSidebar from './RoomModalSidebar';

const FLOOR_OPTIONS = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'].map(floor => ({
  value: floor,
  label: floor
}));

const ROOM_TYPES = ['Lecture Room', 'Laboratory', 'Office', 'Conference Room'].map(type => ({
  value: type,
  label: type
}));

const initialFormState = {
  roomCode: '',
  roomName: '',
  type: '',
  floor: '',
  departmentCode: '',
  capacity: '',
};

const customStyles = {
  menu: (base) => ({
    ...base,
    zIndex: 100,
    backgroundColor: 'var(--select-bg, #ffffff)',
    border: '1px solid var(--select-border, #e5e7eb)',
    '.dark &': {
      backgroundColor: '#1f2937',
      borderColor: '#374151'
    }
  }),
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--select-bg, #ffffff)',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    '.dark &': {
      backgroundColor: '#1f2937',
      borderColor: state.isFocused ? '#3b82f6' : '#374151',
      color: '#e5e7eb'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#323E8F' 
      : state.isFocused 
        ? 'var(--select-hover, #f3f4f6)' 
        : 'transparent',
    color: state.isSelected ? '#ffffff' : 'var(--select-text, #111827)',
    '.dark &': {
      backgroundColor: state.isSelected 
        ? '#323E8F' 
        : state.isFocused 
          ? '#374151' 
          : 'transparent',
      color: state.isSelected ? '#ffffff' : '#e5e7eb'
    }
  })
};

export default function AddEditRoomModal({ show, onClose, room, departments, onSuccess }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = departments.map(dept => ({
    value: dept.departmentCode,
    label: `${dept.departmentCode} - ${dept.departmentName}`
  }));

  useEffect(() => {
    if (room) {
      setFormData({
        roomCode: room.roomCode || '',
        roomName: room.roomName || '',
        type: room.type || '',
        floor: room.floor || '',
        departmentCode: room.department?.departmentCode || room.departmentCode || '',
        capacity: room.capacity || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [room, show]);

  const handleChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : '';
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const form = new FormData();
      
      // Handle basic fields
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });
      
      // Add user ID to form data
      form.append('userId', user?._id);

      // Add updateHistory for edit operations
      if (room) {
        form.append('$push[updateHistory]', JSON.stringify({
          updatedBy: user?._id,
          updatedAt: new Date(),
          action: 'updated'
        }));
      }

      const result = room
        ? await editRoom(room.roomCode, form)
        : await addRoom(form);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Room ${room ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#323E8F',
      });

      setFormData(initialFormState);
      onSuccess();
    } catch (error) {
      console.error('Error submitting room:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${room ? 'update' : 'add'} room`,
        confirmButtonColor: '#323E8F',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormState);
      onClose();
    }
  };

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 block z-[9999]">
                  <button
                    type="button"
                    className="rounded-full bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 transition-colors shadow-sm"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row min-h-[600px]">
                  <RoomModalSidebar room={room} />
                  
                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                      {/* Form content */}
                      <div className="flex-1 p-8 space-y-8">
                        {/* Title */}
                        <div className="pt-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Room Information
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Fill in the details for the room
                          </p>
                        </div>

                        {/* Room Code & Name */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Room Code
                            </label>
                            <input
                              type="text"
                              name="roomCode"
                              id="roomCode"
                              value={formData.roomCode}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="block w-full text-black dark:text-gray-100 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700 dark:placeholder-gray-400"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Room Name
                            </label>
                            <input
                              type="text"
                              name="roomName"
                              id="roomName"
                              value={formData.roomName}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="block w-full text-black dark:text-gray-100 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700 dark:placeholder-gray-400"
                              required
                            />
                          </div>
                        </div>

                        {/* Room Type & Floor */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Room Type
                            </label>
                            <Select
                              id="type"
                              name="type"
                              value={ROOM_TYPES.find(option => option.value === formData.type)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'type' })}
                              options={ROOM_TYPES}
                              styles={customStyles}
                              classNamePrefix="select"
                              placeholder="Select Room Type"
                              isClearable
                              isSearchable
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label htmlFor="floor" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Floor
                            </label>
                            <Select
                              id="floor"
                              name="floor"
                              value={FLOOR_OPTIONS.find(option => option.value === formData.floor)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'floor' })}
                              options={FLOOR_OPTIONS}
                              styles={customStyles}
                              classNamePrefix="select"
                              placeholder="Select Floor"
                              isClearable
                              isSearchable
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* Department & Capacity */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Department
                            </label>
                            <Select
                              id="departmentCode"
                              name="departmentCode"
                              value={departmentOptions.find(option => option.value === formData.departmentCode)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'departmentCode' })}
                              options={departmentOptions}
                              styles={customStyles}
                              classNamePrefix="select"
                              placeholder="Select Department"
                              isClearable
                              isSearchable
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Capacity
                            </label>
                            <input
                              type="number"
                              name="capacity"
                              id="capacity"
                              value={formData.capacity}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="block w-full text-black dark:text-gray-100 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700 dark:placeholder-gray-400"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center items-center rounded-md bg-[#323E8F] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] transition-colors disabled:opacity-70"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>{room ? 'Update Room' : 'Add Room'}</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
