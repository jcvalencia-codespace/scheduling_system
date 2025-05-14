'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { addCourse, editCourse, getDepartments } from '../_actions';
import Select from 'react-select';

const initialFormState = {
  courseCode: '',
  courseTitle: '',
  departmentCode: '',
};

export default function AddEditCourseModal({ show, onClose, course, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <Dialog as="div" className="relative z-[100]" onClose={handleClose}> {/* Changed z-50 to z-[100] */}
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {course ? 'Edit Course' : 'Add Course'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] sm:ml-3 sm:w-auto"
                        >
                          {course ? 'Update' : 'Add'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={handleClose}
                        >
                          Cancel
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
