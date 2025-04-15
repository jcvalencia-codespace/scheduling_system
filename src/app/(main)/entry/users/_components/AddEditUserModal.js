'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addUser, editUser, getDepartments, getCoursesByDepartment } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { FullFormSkeleton, CourseDropdownSkeleton } from './Skeleton';

const initialFormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  password: '',
  role: '',
  department: '',
  course: '',
  employmentType: ''
};

export default function AddEditUserModal({ show, onClose, user, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Add this state to track course loading
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  useEffect(() => {
    // Fetch departments when modal opens
    if (show) {
      fetchDepartments();
    }
  }, [show]);

  useEffect(() => {
    // Fetch courses when department changes
    if (formData.department) {
      fetchCourses(formData.department);
    } else {
      setCourses([]);
    }
  }, [formData.department]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        email: user.email,
        password: '',
        role: user.role,
        // Use the actual IDs from the populated objects
        department: user.department?._id || '',
        course: user.course?._id || '',
        employmentType: user.employmentType
      });

      // If there's a department, fetch its courses
      if (user.department?._id) {
        fetchCourses(user.department._id);
      }
    } else {
      setFormData(initialFormState);
    }
  }, [user, show]);

  const fetchDepartments = async () => {
    const result = await getDepartments();
    if (result.departments) {
      setDepartments(result.departments);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch departments',
        confirmButtonColor: '#323E8F'
      });
    }
    setIsLoading(false);
  };



  // Update fetchCourses function
  const fetchCourses = async (departmentId) => {
    setIsLoadingCourses(true);
    const result = await getCoursesByDepartment(departmentId);
    if (result.courses) {
      setCourses(result.courses);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch courses',
        confirmButtonColor: '#323E8F'
      });
    }
    setIsLoadingCourses(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);

      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' || key === 'middleName') {
          form.append(key, formData[key]);
        }
      });

      const result = user
        ? await editUser(user._id, form)
        : await addUser(form);

      console.log('Server response:', result);

      if (result.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error,
          confirmButtonColor: '#323E8F'
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: user ? 'User updated successfully!' : 'User created successfully!',
          confirmButtonColor: '#323E8F'
        });
        setFormData(initialFormState);
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while saving',
        confirmButtonColor: '#323E8F'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Modify handleChange to handle react-select changes
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormState);
      onClose();
    }
  };
  const formatDepartmentOptions = () => {
    return departments.map(dept => ({
      value: dept._id,
      label: dept.departmentName
    }));
  };

  const formatCourseOptions = () => {
    return courses.map(course => ({
      value: course._id,
      label: course.courseTitle
    }));
  };

  const roleOptions = [
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Dean', label: 'Dean' },
    { value: 'Program Chair', label: 'Program Chair' },
    { value: 'Faculty', label: 'Faculty' }
  ];

  const employmentTypeOptions = [
    { value: 'full-time', label: 'Full-Time' },
    { value: 'part-time', label: 'Part-Time' }
  ];

  // Update the customStyles object
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#323E8F' : '#E5E7EB',
      borderRadius: '0.375rem', // rounded-md
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
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
      maxHeight: '200px', // Set maximum height
      overflowY: 'auto', // Enable vertical scrolling
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
                      {user ? 'Edit User' : 'Add New User'}
                    </Dialog.Title>
                    <div className="mt-4">
                      {isLoading ? (
                        <FullFormSkeleton />
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                              </label>
                              <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div>
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                              </label>
                              <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                                Middle Name (Optional)
                              </label>
                              <input
                                type="text"
                                name="middleName"
                                id="middleName"
                                value={formData.middleName}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                              </label>
                              <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {user ? 'New Password (leave blank to keep current)' : 'Password'}
                              </label>
                              <input
                                type="password"
                                name="password"
                                id="password"
                                required={!user}
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div>
                              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role
                              </label>
                              <Select
                                id="role"
                                name="role"
                                options={roleOptions}
                                value={roleOptions.find(option => option.value === formData.role)}
                                onChange={(option) => handleSelectChange(option, { name: 'role' })}
                                isDisabled={isSubmitting}
                                className="mt-1 text-black"
                                classNamePrefix="select"
                                placeholder="Select Role"
                                isClearable={true}
                                styles={customStyles}
                                maxMenuHeight={200}
                                menuPlacement="top"
                                isRequired
                              />
                            </div>

                            <div>
                              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                                Department
                              </label>
                              <Select
                                id="department"
                                name="department"
                                options={formatDepartmentOptions()}
                                value={formatDepartmentOptions().find(option => option.value === formData.department) || null}
                                onChange={(option) => handleSelectChange(option, { name: 'department' })}
                                isDisabled={isSubmitting}
                                className="mt-1 text-black"
                                classNamePrefix="select"
                                placeholder="Select Department"
                                isClearable={true}
                                styles={customStyles}
                                maxMenuHeight={200}
                                menuPlacement="top"
                                isRequired
                              />
                            </div>


                            <div>
                              <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                                Course
                              </label>
                              {isLoadingCourses ? (
                                <div className="mt-1">
                                  <CourseDropdownSkeleton />
                                </div>
                              ) : (
                                <Select
                                  id="course"
                                  name="course"
                                  options={formatCourseOptions()}
                                  value={formatCourseOptions().find(option => option.value === formData.course) || null}
                                  onChange={(option) => handleSelectChange(option, { name: 'course' })}
                                  isDisabled={isSubmitting || !formData.department}
                                  className="mt-1 text-black"
                                  classNamePrefix="select"
                                  placeholder="Select Course"
                                  isClearable={true}
                                  styles={customStyles}
                                  maxMenuHeight={200}
                                  menuPlacement="top"
                                  isRequired
                                />
                              )}
                            </div>

                            <div>
                              <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                                Employment Type
                              </label>
                              <Select
                                id="employmentType"
                                name="employmentType"
                                options={employmentTypeOptions}
                                value={employmentTypeOptions.find(option => option.value === formData.employmentType)}
                                onChange={(option) => handleSelectChange(option, { name: 'employmentType' })}
                                isDisabled={isSubmitting}
                                className="mt-1 text-black"
                                classNamePrefix="select"
                                placeholder="Select Employment Type"
                                isClearable={true}
                                styles={customStyles}
                                maxMenuHeight={200}
                                menuPlacement="top"
                                isRequired
                              />
                            </div>
                          </div>

                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className={`inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isSubmitting ? 'Saving...' : (user ? 'Update User' : 'Add User')}
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                              onClick={handleClose}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
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
