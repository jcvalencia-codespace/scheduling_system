'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addSubject, editSubject, getSubjects } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import useAuthStore from '../../../../../store/useAuthStore';
import SubjectModalSidebar from './SubjectModalSidebar';

const initialFormState = {
  subjectCode: '',
  subjectName: '',
  department: ''
};

export default function AddEditSubjectForm({ show, onClose, subject, onSuccess }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        department: subject.department?._id || subject.department
      });
    } else {
      setFormData(initialFormState);
    }
  }, [subject, show]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const result = await getSubjects();
      if (result.departments) {
        setDepartments(result.departments);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!user || !user._id) {
        throw new Error('User not authenticated');
      }

      console.log('Submitting form data:', formData);
      
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });
      
      form.append('userId', user._id);

      const result = subject 
        ? await editSubject(subject.subjectCode, form)
        : await addSubject(form);

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
          text: subject ? 'Subject updated successfully!' : 'Subject added successfully!',
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

  const handleChange = (e) => {
    const { name, value } = e.target || {};
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

  const customStyles = {
    menu: (base) => ({
      ...base,
      zIndex: 100,
      backgroundColor: 'var(--select-bg, #ffffff)',
      border: '1px solid var(--select-border, #e5e7eb)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      borderRadius: '0.375rem',
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: '#374151'
      }
    }),
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      backgroundColor: 'var(--select-bg, #ffffff)',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: state.isFocused ? '#3b82f6' : '#374151'
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
      },
      '&:hover': {
        backgroundColor: state.isSelected ? '#323E8F' : 'var(--select-hover, #f3f4f6)'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--select-placeholder, #6b7280)',
      '.dark &': {
        color: '#9ca3af'
      }
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '160px',
      overflowY: 'auto',
      '.dark &': {
        '*': {
          scrollbarColor: '#4b5563 #1f2937',
          scrollbarWidth: 'thin'
        }
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">
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
                  <SubjectModalSidebar subject={subject} />
                  
                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                      {/* Form content */}
                      <div className="flex-1 p-8 space-y-8">
                        {/* Title */}
                        <div className="pt-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Subject Information
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Fill in the details for the subject
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Subject Code
                            </label>
                            <input
                              type="text"
                              name="subjectCode"
                              id="subjectCode"
                              required
                              value={formData.subjectCode}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              placeholder="Subject Code... e.g. COMP101"
                              className="block w-full rounded-md border-gray-300 text-gray-900 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 uppercase"
                            />
                          </div>

                          <div>
                            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Subject Name
                            </label>
                            <input
                              type="text"
                              name="subjectName"
                              id="subjectName"
                              required
                              value={formData.subjectName}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              placeholder="Subject Name..."
                              className="block w-full rounded-md border-gray-300 text-gray-900 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Department
                            </label>
                            <Select
                              id="department"
                              name="department"
                              value={departments.find(d => d._id === formData.department) ? {
                                value: formData.department,
                                label: `${departments.find(d => d._id === formData.department).departmentCode} - ${departments.find(d => d._id === formData.department).departmentName}`
                              } : null}
                              onChange={(selectedOption) => {
                                setFormData(prev => ({
                                  ...prev,
                                  department: selectedOption?.value || ''
                                }));
                              }}
                              options={departments.map(dept => ({
                                value: dept._id,
                                label: `${dept.departmentCode} - ${dept.departmentName}`
                              }))}
                              isDisabled={isSubmitting}
                              styles={customStyles}
                              placeholder="Select a department..."
                              isSearchable
                              isClearable
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
                            <>{subject ? 'Update Subject' : 'Add Subject'}</>
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
