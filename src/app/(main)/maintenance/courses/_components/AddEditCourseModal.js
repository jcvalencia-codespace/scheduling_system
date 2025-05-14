'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { addCourse, editCourse, getDepartments } from '../_actions';
import Select from 'react-select';
import CourseModalSidebar from './CourseModalSidebar';

const initialFormState = {
  courseCode: '',
  courseTitle: '',
  departmentCode: '',
};

export default function AddEditCourseModal({ show, onClose, course, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      zIndex: 110, // Increased z-index for dropdown menu
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '150px',
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

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (course) {
      setFormData({
        courseCode: course.courseCode || '',
        courseTitle: course.courseTitle || '',
        departmentCode: course.department?.departmentCode || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [course, show]);

  const loadDepartments = async () => {
    try {
      const result = await getDepartments();
      if (result.error) {
        throw new Error(result.error);
      }
      setDepartments(result.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load departments',
        confirmButtonColor: '#323E8F'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('courseCode', formData.courseCode);
      formDataToSend.append('courseTitle', formData.courseTitle);
      formDataToSend.append('departmentCode', formData.departmentCode);

      const response = course
        ? await editCourse(course.courseCode, formDataToSend)
        : await addCourse(formDataToSend);

      if (response.error) {
        throw new Error(response.error);
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Course ${course ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#323E8F',
      });

      setFormData(initialFormState);
      onSuccess();
    } catch (error) {
      console.error('Error submitting course:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${course ? 'update' : 'add'} course`,
        confirmButtonColor: '#323E8F',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    onClose();
  };

  const handleChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : '';
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.departmentCode,
    label: `${dept.departmentCode} - ${dept.departmentName}`
  }));

  if (isLoading) {
    return null; // Don't render modal while loading departments
  }

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
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
                  <CourseModalSidebar course={course} />
                  
                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                      {/* Form content */}
                      <div className="flex-1 p-8 space-y-8">
                        {/* Title */}
                        <div className="pt-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Course Information
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Fill in the details for the course
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                              Course Code
                            </label>
                            <input
                              type="text"
                              name="courseCode"
                              id="courseCode"
                              value={formData.courseCode}
                              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                              placeholder="Enter course code"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700">
                              Course Title
                            </label>
                            <input
                              type="text"
                              name="courseTitle"
                              id="courseTitle"
                              value={formData.courseTitle}
                              onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                              required
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
                              placeholder="Select a department"
                              isClearable
                              isSearchable
                              menuPlacement="top"                           
                              required
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
                            <>{course ? 'Update Course' : 'Add Course'}</>
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
