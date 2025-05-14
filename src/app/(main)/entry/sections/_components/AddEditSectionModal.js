'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { addSection, editSection } from '../_actions';
import useAuthStore from '@/store/useAuthStore';
import Swal from 'sweetalert2';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => ({
  value: year,
  label: year
}));

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
    maxHeight: '130px',
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
        courseCode: {
          value: section.course?._id || '',
          label: `${section.course?.courseCode} - ${section.course?.courseTitle} (${section.course?.department?.departmentCode || 'N/A'})`
        },
        yearLevel: {
          value: section.yearLevel || '',
          label: section.yearLevel || ''
        },
      });
    } else {
      setFormData(initialFormState);
    }
  }, [section, show]);

  const handleChange = (name) => (event) => {
    const value = event?.target?.value ?? event; // Handle both input and Select changes
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
      form.append('sectionName', formData.sectionName);
      form.append('courseCode', formData.courseCode.value);
      form.append('yearLevel', formData.yearLevel.value);
      form.append('userId', user._id);

      const result = section
        ? await editSection(section._id, form) // Use section._id instead of section.sectionName
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
                              onChange={handleChange('sectionName')}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                              Course
                            </label>
                            <Select
                              id="courseCode"
                              name="courseCode"
                              value={formData.courseCode}
                              onChange={handleChange('courseCode')}
                              options={courses.map(course => ({
                                value: course._id,
                                label: `${course.courseCode} - ${course.courseTitle} (${course.department?.departmentCode || 'N/A'})`
                              }))}
                              isDisabled={isSubmitting}
                              styles={customStyles}
                              placeholder="Select Course"
                              className="mt-1"
                              isSearchable={true}
                              isClearable={true}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">
                              Year Level
                            </label>
                            <Select
                              id="yearLevel"
                              name="yearLevel"
                              value={formData.yearLevel}
                              onChange={handleChange('yearLevel')}
                              options={YEAR_LEVELS}
                              isDisabled={isSubmitting}
                              styles={customStyles}
                              placeholder="Select Year Level"
                              className="mt-1"
                              menuPlacement='top'
                              isSearchable={true}
                              isClearable={true}
                            />
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
