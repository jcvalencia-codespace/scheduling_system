'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { addUser, editUser, getDepartments, getAllCourses } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { FullFormSkeleton, CourseDropdownSkeleton } from './Skeleton';
import UserModalSidebar from './UserModalSidebar';

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
  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (show) {
      fetchDepartments();
      fetchAllCourses();
    }
  }, [show]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        email: user.email,
        password: '',
        role: user.role,
        department: user.department?._id || '',
        course: user.course?._id || '',
        employmentType: user.employmentType
      });
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

  const fetchAllCourses = async () => {
    const result = await getAllCourses();
    if (result.courses) {
      setAllCourses(result.courses);
      setCourses(result.courses);
    }
  };

  const validatePassword = (password) => {
    if (password === '') return true; // Allow empty password for editing
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError("Password must contain at least 1 number");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password && !validatePassword(formData.password)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          form.append(key, value);
        }
      });

      const result = user ? await editUser(user._id, form) : await addUser(form);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: result.message || `User ${user ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#323E8F',
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${user ? 'update' : 'add'} user`,
        confirmButtonColor: '#323E8F',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (selectedOption, { name }) => {
    if (name === 'role' && selectedOption?.value === 'Administrator') {
      setFormData(prev => ({
        ...prev,
        [name]: selectedOption.value,
        department: '',
        course: '',
        employmentType: 'full-time'
      }));
    } else if (name === 'department') {
      setFormData(prev => ({
        ...prev,
        [name]: selectedOption ? selectedOption.value : '',
        course: ''
      }));
      if (selectedOption) {
        const filteredCourses = allCourses.filter(
          course => course.department?._id === selectedOption.value
        );
        setCourses(filteredCourses);
      } else {
        setCourses(allCourses);
      }
    } else if (name === 'course' && selectedOption) {
      const selectedCourse = allCourses.find(c => c._id === selectedOption.value);
      if (selectedCourse?.department?._id) {
        setFormData(prev => ({
          ...prev,
          [name]: selectedOption.value,
          department: selectedCourse.department._id
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: selectedOption.value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: selectedOption ? selectedOption.value : ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      validatePassword(value);
    }
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
    const coursesToShow = formData.department 
      ? allCourses.filter(course => course.department?._id === formData.department)
      : allCourses;
    
    return coursesToShow.map(course => ({
      value: course._id,
      label: `${course.courseCode} - ${course.courseTitle}`
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

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
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
      maxHeight: '200px',
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
                  <UserModalSidebar user={user} />
                  
                  <div className="w-full md:w-2/3 flex flex-col">
                    {isLoading ? (
                      <div className="p-8">
                        <FullFormSkeleton />
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                        <div className="flex-1 p-8 space-y-8">
                          <div className="pt-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              User Information
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Fill in the details for the user account
                            </p>
                          </div>

                          <div className="space-y-6">
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
                                {user ? (
                                  <div className="flex flex-col space-y-1">
                                    <div className="relative mt-1">
                                      <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={`block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ${
                                          passwordError ? 'ring-red-500' : 'ring-gray-300'
                                        } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <button
                                          type="button"
                                          onClick={() => setShowPassword(!showPassword)}
                                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                          {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                          ) : (
                                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    {passwordError && (
                                      <p className="text-sm text-red-600">{passwordError}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 px-3">
                                      Password will be auto-generated
                                    </div>
                                    <p className="mt-1 text-sm text-blue-600">
                                      A secure password will be generated and sent to the user's email
                                    </p>
                                  </div>
                                )}
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

                              {formData.role !== 'Administrator' && (
                                <>
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
                                    <Select
                                      id="course"
                                      name="course"
                                      options={formatCourseOptions()}
                                      value={formatCourseOptions().find(option => option.value === formData.course) || null}
                                      onChange={(option) => handleSelectChange(option, { name: 'course' })}
                                      isDisabled={isSubmitting}
                                      className="mt-1 text-black"
                                      classNamePrefix="select"
                                      placeholder="Select Course"
                                      isClearable={true}
                                      styles={customStyles}
                                      maxMenuHeight={200}
                                      menuPlacement="top"
                                      isRequired
                                    />
                                  </div>
                                </>
                              )}

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
                                  isDisabled={isSubmitting || formData.role === 'Administrator'}
                                  className="mt-1 text-black"
                                  classNamePrefix="select"
                                  placeholder="Select Employment Type"
                                  isClearable={!formData.role === 'Administrator'}
                                  styles={customStyles}
                                  maxMenuHeight={200}
                                  menuPlacement="top"
                                  isRequired
                                />
                              </div>
                            </div>
                          </div>

                        </div>

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
                              <>{user ? 'Update User' : 'Add User'}</>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
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
