'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addTerm, editTerm } from '../_actions';
import Swal from 'sweetalert2';

export default function AddEditTermModal({ open, setOpen, title, selectedTerm, onSuccess, terms }) {
  const [formData, setFormData] = useState({
    academicYear: '',
    term: '',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or when selectedTerm changes
  useEffect(() => {
    // Reset form data and error
    if (selectedTerm) {
      // Convert dates from YYYY-MM-DD to the format expected by the date input
      setFormData({
        academicYear: selectedTerm.academicYear,
        term: selectedTerm.term,
        startDate: selectedTerm.startDate, // Keep as YYYY-MM-DD for date input
        endDate: selectedTerm.endDate, // Keep as YYYY-MM-DD for date input
      });
    } else {
      setFormData({
        academicYear: '',
        term: '',
        startDate: '',
        endDate: '',
      });
    }
    setError('');
  }, [selectedTerm]);

  // Clear form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        academicYear: '',
        term: '',
        startDate: '',
        endDate: '',
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any existing errors
    try {
      // Parse dates handling both MM/DD/YYYY and YYYY-MM-DD formats
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        
        // Check if date is already in YYYY-MM-DD format
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-');
          return new Date(year, month - 1, day);
        }
        
        // Parse MM/DD/YYYY format
        const parts = dateStr.split('/');
        if (parts.length !== 3) {
          setError('Invalid date format. Please use MM/DD/YYYY');
          return null;
        }
        
        const [month, day, year] = parts;
        return new Date(year, month - 1, day);
      };

      const formatDate = (date) => {
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      };

      const startDate = parseDate(formData.startDate);
      const endDate = parseDate(formData.endDate);
      
      // Validate dates are valid
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        return;
      }

      // Compare dates without time components
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (startDateOnly >= endDateOnly) {
        setError('End date must be after start date');
        return;
      }

      // Check for overlapping terms
      const existingTerms = terms.filter(term => 
        // Exclude current term when editing
        selectedTerm ? term.id !== selectedTerm.id : true
      );

      for (const term of existingTerms) {
        const termStart = parseDate(term.startDate);
        const termEnd = parseDate(term.endDate);
        
        // Check if either the start or end date falls within another term's range
        const overlap = (
          (startDate >= termStart && startDate <= termEnd) || // New start date overlaps
          (endDate >= termStart && endDate <= termEnd) ||     // New end date overlaps
          (startDate <= termStart && endDate >= termEnd)      // New term completely encompasses existing term
        );

        if (overlap) {
          setError(`Date range overlaps with ${term.term} (${term.academicYear}): ${formatDate(termStart)} - ${formatDate(termEnd)}`);
          return;
        }
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Convert dates to ISO format for sending to server
        if (key === 'startDate' || key === 'endDate') {
          const date = parseDate(value);
          formDataToSend.append(key, date.toISOString().split('T')[0]);
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = selectedTerm
        ? await editTerm(selectedTerm.id, formDataToSend)
        : await addTerm(formDataToSend);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Reset form data
      setFormData({
        academicYear: '',
        term: '',
        startDate: '',
        endDate: '',
      });

      onSuccess?.();
      setOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Term ${selectedTerm ? 'updated' : 'added'} successfully`,
        confirmButtonColor: '#323E8F'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || `Failed to ${selectedTerm ? 'update' : 'add'} term`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate academic year options (current year - 1 to current year + 5)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = -1; i <= 5; i++) {
    const year = currentYear + i;
    academicYears.push(`${year}-${year + 1}`);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
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
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                    >
                      {title}
                    </Dialog.Title>
                    {error && (
                      <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="academicYear"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Academic Year
                        </label>
                        <select
                          id="academicYear"
                          name="academicYear"
                          value={formData.academicYear}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                          required
                        >
                          <option value="">Select Academic Year</option>
                          {academicYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="term"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Term
                        </label>
                        <select
                          id="term"
                          name="term"
                          value={formData.term}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                          required
                        >
                          <option value="">Select Term</option>
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                          required
                        />
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#323E8F] sm:col-start-2"
                        >
                          {selectedTerm ? 'Update Term' : 'Add Term'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                          onClick={() => setOpen(false)}
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
