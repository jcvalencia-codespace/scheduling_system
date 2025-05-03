'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addRoom, editRoom } from '../_actions';
import Swal from 'sweetalert2';
import useAuthStore from '../../../../../store/useAuthStore';
import Select from 'react-select';

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

export default function AddEditRoomModal({ show, onClose, room, departments, onSuccess }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#323E8F' : '#E5E7EB',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        borderColor: '#323E8F'
      },
      '&:focus': {
        borderColor: '#323E8F',
        boxShadow: '0 0 0 1px #323E8F'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6B7280',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#323E8F' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : 'black',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 100,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '120px',
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px'
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1'
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px'
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555'
      }
    })
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {room ? 'Edit Room' : 'Add Room'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                              Room Code
                            </label>
                            <input
                              type="text"
                              name="roomCode"
                              id="roomCode"
                              value={formData.roomCode}
                              onChange={handleInputChange}
                              disabled={!!room || isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700">
                              Room Name
                            </label>
                            <input
                              type="text"
                              name="roomName"
                              id="roomName"
                              value={formData.roomName}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                              Room Type
                            </label>
                            <Select
                              id="type"
                              name="type"
                              value={ROOM_TYPES.find(option => option.value === formData.type)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'type' })}
                              options={ROOM_TYPES}
                              styles={customStyles}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder="Select Room Type"
                              isClearable
                              isSearchable
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                              Floor
                            </label>
                            <Select
                              id="floor"
                              name="floor"
                              value={FLOOR_OPTIONS.find(option => option.value === formData.floor)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'floor' })}
                              options={FLOOR_OPTIONS}
                              styles={customStyles}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder="Select Floor"
                              isClearable
                              isSearchable
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700">
                              Department
                            </label>
                            <Select
                              id="departmentCode"
                              name="departmentCode"
                              value={departmentOptions.find(option => option.value === formData.departmentCode)}
                              onChange={(option, action) => handleChange(option, { ...action, name: 'departmentCode' })}
                              options={departmentOptions}
                              styles={customStyles}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder="Select Department"
                              isClearable
                              isSearchable
                              menuPlacement="top" 
                              required
                              isDisabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                              Capacity
                            </label>
                            <input
                              type="number"
                              name="capacity"
                              id="capacity"
                              value={formData.capacity}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              min="0"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                          >
                            {room ? 'Update' : 'Add'}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                            onClick={handleClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
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
