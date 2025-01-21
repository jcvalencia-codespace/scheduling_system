'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addRoom, editRoom } from '../_actions';
import Swal from 'sweetalert2';

const FLOOR_OPTIONS = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];
const ROOM_TYPES = ['Lecture Room', 'Laboratory', 'Office', 'Conference Room'];

const initialFormState = {
  roomCode: '',
  roomName: '',
  type: '',
  floor: '',
  departmentCode: '',
  capacity: '',
};

export default function AddEditRoomModal({ show, onClose, room, departments, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        roomCode: room.roomCode || '',
        roomName: room.roomName || '',
        type: room.type || '',
        floor: room.floor || '',
        departmentCode: room.departmentCode || '',
        capacity: room.capacity || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [room, show]);

  const handleChange = (e) => {
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
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });

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
                              onChange={handleChange}
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
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                              Room Type
                            </label>
                            <select
                              name="type"
                              id="type"
                              value={formData.type}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            >
                              <option value="">Select Room Type</option>
                              {ROOM_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                              Floor
                            </label>
                            <select
                              name="floor"
                              id="floor"
                              value={formData.floor}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            >
                              <option value="">Select Floor</option>
                              {FLOOR_OPTIONS.map((floor) => (
                                <option key={floor} value={floor}>
                                  {floor}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700">
                              Department
                            </label>
                            <select
                              name="departmentCode"
                              id="departmentCode"
                              value={formData.departmentCode}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            >
                              <option value="">Select Department</option>
                              {departments.map((dept) => (
                                <option key={dept.departmentCode} value={dept.departmentCode}>
                                  {dept.departmentCode} - {dept.departmentName}
                                </option>
                              ))}
                            </select>
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
                              onChange={handleChange}
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
