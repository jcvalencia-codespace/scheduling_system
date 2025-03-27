'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addSection, editSection } from '../_actions';
import useAuthStore from '@/store/useAuthStore'; // Fixed import path
import Swal from 'sweetalert2';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const initialFormState = {
  sectionName: '',
  courseCode: '',
  yearLevel: '',
};

export default function AddEditSectionModal({ show, onClose, section, courses, onSuccess }) {
  const user = useAuthStore((state) => state.user); // Changed to use zustand store
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (section) {
      setFormData({
        sectionName: section.sectionName || '',
        courseCode: section.course?._id || '',
        yearLevel: section.yearLevel || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [section, show]);

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
      if (!user?._id) {
        throw new Error('User not authenticated');
      }

      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });
      form.append('userId', user._id);

      const result = section
        ? await editSection(section.sectionName, form)
        : await addSection(form);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Section ${section ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#323E8F',
      });

      setFormData(initialFormState);
      onSuccess();
    } catch (error) {
      console.error('Error submitting section:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${section ? 'update' : 'add'} section`,
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
                      {section ? 'Edit Section' : 'Add Section'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700">
                              Section Name
                            </label>
                            <input
                              type="text"
                              name="sectionName"
                              id="sectionName"
                              value={formData.sectionName}
                              onChange={handleChange}
                              disabled={isSubmitting}  // Removed !!section condition
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                              Course
                            </label>
                            <select
                              name="courseCode"
                              id="courseCode"
                              value={formData.courseCode}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            >
                              <option value="">Select Course</option>
                              {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                  {course.courseCode} - {course.courseTitle} ({course.department?.departmentCode || 'N/A'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">
                              Year Level
                            </label>
                            <select
                              name="yearLevel"
                              id="yearLevel"
                              value={formData.yearLevel}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            >
                              <option value="">Select Year Level</option>
                              {YEAR_LEVELS.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                          >
                            {section ? 'Update' : 'Add'}
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
