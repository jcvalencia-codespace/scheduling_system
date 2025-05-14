'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { addSection, editSection } from '../_actions';
import useAuthStore from '@/store/useAuthStore';
import Swal from 'sweetalert2';
import SectionModalSidebar from './SectionModalSidebar';

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
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!section && user?.role === 'Program Chair' && courses.length === 1) {
      const userCourse = courses[0];
      setFormData(prev => ({
        ...prev,
        courseCode: {
          value: userCourse._id,
          label: `${userCourse.courseCode} - ${userCourse.courseTitle} (${userCourse.department?.departmentCode || 'N/A'})`
        }
      }));
    } else if (section) {
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
  }, [section, show, user, courses]);

  const handleChange = (name) => (event) => {
    const value = event?.target?.value ?? event;
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
        ? await editSection(section._id, form)
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 block z-[9999]">
                  <button
                    type="button"
                    className="rounded-full bg-white text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1.5 transition-colors shadow-sm"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row min-h-[600px]">
                  <SectionModalSidebar section={section} />
                  
                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                      {/* Form content */}
                      <div className="flex-1 p-8 space-y-8">
                        {/* Title */}
                        <div className="pt-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Section Information
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Fill in the details for the section
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1">
                              Section Name
                            </label>
                            <input
                              type="text"
                              name="sectionName"
                              id="sectionName"
                              value={formData.sectionName}
                              onChange={handleChange('sectionName')}
                              disabled={isSubmitting}
                              className="block text-black w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
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
                              styles={customStyles}
                              placeholder="Select Course"
                              isSearchable={true}
                              isClearable={true}
                            />
                          </div>

                          <div>
                            <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700 mb-1">
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
                              isSearchable={true}
                              isClearable={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
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
                            <>{section ? 'Update Section' : 'Add Section'}</>
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
