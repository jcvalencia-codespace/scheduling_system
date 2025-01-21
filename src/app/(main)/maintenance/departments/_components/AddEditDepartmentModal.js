'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { addDepartment, editDepartment } from '../_actions';

const initialFormState = {
  departmentCode: '',
  departmentName: '',
};

export default function AddEditDepartmentModal({ show, onClose, department, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (department) {
      setFormData({
        departmentCode: department.departmentCode || '',
        departmentName: department.departmentName || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [department, show]); // Added show dependency to reset form when modal opens/closes

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('departmentCode', formData.departmentCode);
      formDataToSend.append('departmentName', formData.departmentName);

      const response = department
        ? await editDepartment(department.departmentCode, formDataToSend)
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
    }
  };

  const handleClose = () => {
    setFormData(initialFormState); // Clear form on close
    onClose();
  };

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                      {department ? 'Edit Department' : 'Add Department'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label htmlFor="departmentCode" className="block text-sm font-medium text-gray-700">
                          Department Code
                        </label>
                        <input
                          type="text"
                          name="departmentCode"
                          id="departmentCode"
                          value={formData.departmentCode}
                          onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                          disabled={!!department}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700">
                          Department Name
                        </label>
                        <input
                          type="text"
                          name="departmentName"
                          id="departmentName"
                          value={formData.departmentName}
                          onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                          required
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] sm:ml-3 sm:w-auto"
                        >
                          {department ? 'Update' : 'Add'}
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
