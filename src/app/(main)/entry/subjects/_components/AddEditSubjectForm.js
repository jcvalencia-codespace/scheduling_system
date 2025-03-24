'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addSubject, editSubject } from '../_actions';
import Swal from 'sweetalert2';

const initialFormState = {
  schoolYear: '',
  term: '',
  subjectCode: '',
  subjectName: '',
  lectureHours: '',
  labHours: '',
  course: '',
  unit: ''
};

export default function AddEditSubjectForm({ show, onClose, subject, onSuccess }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({
        schoolYear: subject.schoolYear,
        term: subject.term,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        lectureHours: subject.lectureHours,
        labHours: subject.labHours,
        course: subject.course,
        unit: subject.unit
      });
    } else {
      setFormData(initialFormState);
    }
  }, [subject, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });

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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2"
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
                      {subject ? 'Edit Subject' : 'Add New Subject'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700">
                              School Year
                            </label>
                            <input
                              type="text"
                              name="schoolYear"
                              id="schoolYear"
                              required
                              value={formData.schoolYear}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              placeholder="2023-2024"
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="term" className="block text-sm font-medium text-gray-700">
                              Term
                            </label>
                            <select
                              name="term"
                              id="term"
                              required
                              value={formData.term}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            >
                              <option value="">Select Term</option>
                              <option value="1">1st Term</option>
                              <option value="2">2nd Term</option>
                              <option value="3">3rd Term</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700">
                              Subject Code
                            </label>
                            <input
                              type="text"
                              name="subjectCode"
                              id="subjectCode"
                              required
                              value={formData.subjectCode}
                              onChange={handleChange}
                              disabled={isSubmitting || !!subject}
                              placeholder="COMP101"
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6 uppercase"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700">
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
                              placeholder="Introduction to Computing"
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div>
                            <label htmlFor="lectureHours" className="block text-sm font-medium text-gray-700">
                              Lecture Hours
                            </label>
                            <input
                              type="number"
                              name="lectureHours"
                              id="lectureHours"
                              required
                              min="0"
                              step="0.5"
                              value={formData.lectureHours}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div>
                            <label htmlFor="labHours" className="block text-sm font-medium text-gray-700">
                              Lab Hours
                            </label>
                            <input
                              type="number"
                              name="labHours"
                              id="labHours"
                              required
                              min="0"
                              step="0.5"
                              value={formData.labHours}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                              Unit
                            </label>
                            <input
                              type="number"
                              name="unit"
                              id="unit"
                              required
                              min="0"
                              step="0.5"
                              value={formData.unit}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                              Course
                            </label>
                            <input
                              type="text"
                              name="course"
                              id="course"
                              required
                              value={formData.course}
                              onChange={handleChange}
                              disabled={isSubmitting}
                              placeholder="BSCS"
                              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#323E8F] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] sm:ml-3 sm:w-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isSubmitting ? 'Saving...' : (subject ? 'Update Subject' : 'Add Subject')}
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
