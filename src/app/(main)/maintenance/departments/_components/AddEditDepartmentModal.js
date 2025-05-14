'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { addDepartment, editDepartment } from '../_actions';
import DepartmentModalSidebar from './DepartmentModalSidebar';

const initialFormState = {
  departmentCode: '',
  departmentName: '',
};

export default function AddEditDepartmentModal({ show, onClose, department, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        departmentCode: department.departmentCode || '',
        departmentName: department.departmentName || '',
        originalCode: department.departmentCode // Store original code for comparison
      });
    } else {
      setFormData(initialFormState);
    }
  }, [department, show]); // Added show dependency to reset form when modal opens/closes

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('departmentCode', formData.departmentCode);
      formDataToSend.append('departmentName', formData.departmentName);
      if (formData.originalCode) {
        formDataToSend.append('originalCode', formData.originalCode);
      }

      const response = department
        ? await editDepartment(formData.originalCode || department.departmentCode, formDataToSend)
        : await addDepartment(formDataToSend);

      if (response.error) {
        throw new Error(response.error);
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Department ${department ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#323E8F',
      });

      setFormData(initialFormState); // Clear form
      onSuccess();
    } catch (error) {
      console.error('Error submitting department:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `Failed to ${department ? 'update' : 'add'} department`,
        confirmButtonColor: '#323E8F',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormState); // Clear form on close
      onClose();
    }
  };

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
                  <DepartmentModalSidebar department={department} />
                  
                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                      {/* Form content */}
                      <div className="flex-1 p-8 space-y-8">
                        {/* Title */}
                        <div className="pt-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Department Information
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Fill in the details for the department
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700 mb-1">
                              Department Code
                            </label>
                            <input
                              type="text"
                              name="departmentCode"
                              id="departmentCode"
                              value={formData.departmentCode}
                              onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                              className="block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm uppercase"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-1">
                              Department Name
                            </label>
                            <input
                              type="text"
                              name="departmentName"
                              id="departmentName"
                              value={formData.departmentName}
                              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                              className="block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
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
                            <>{department ? 'Update Department' : 'Add Department'}</>
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
