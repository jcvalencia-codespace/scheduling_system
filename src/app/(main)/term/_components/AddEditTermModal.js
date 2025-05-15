'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { addTerm, editTerm } from '../_actions';
import Swal from 'sweetalert2';

export default function AddEditTermModal({ open, setOpen, title, selectedTerm, onSuccess, terms }) {
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
      backgroundColor: state.isSelected 
        ? '#323E8F' 
        : state.isFocused 
          ? '#EFF6FF' 
          : 'white',
      color: state.isDisabled 
        ? '#9CA3AF' 
        : state.isSelected 
          ? 'white' 
          : 'black',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      padding: '8px 12px',
      opacity: state.isDisabled ? 0.6 : 1,
      '&::after': state.isDisabled ? {
        content: '"(Already Added)"',
        marginLeft: '8px',
        color: '#9CA3AF',
        fontSize: '0.875rem',
        fontStyle: 'italic'
      } : {}
    }),
    menu: (base) => ({
      ...base,
      zIndex: 100,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '100px',
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

  const [formData, setFormData] = useState({
    academicYear: '',
    term: '',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  const [existingTerms, setExistingTerms] = useState([]);

  useEffect(() => {
    if (terms) {
      const existingTermNumbers = terms
        .filter(term => !selectedTerm || term.id !== selectedTerm.id)
        .map(term => term.term);
      setExistingTerms(existingTermNumbers);
    }
  }, [terms, selectedTerm]);

  useEffect(() => {
    if (selectedTerm) {
      setFormData({
        academicYear: selectedTerm.academicYear,
        term: selectedTerm.term,
        startDate: selectedTerm.startDate,
        endDate: selectedTerm.endDate,
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
    setError('');
    try {
      const parseDate = (dateStr) => {
        if (!dateStr) return null;

        // For YYYY-MM-DD format (from date input)
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          // month - 1 because JavaScript months are 0-based
          return new Date(Date.UTC(year, month - 1, day));
        }

        // For MM/DD/YYYY format (manual input)
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Swap day and month to handle correct order
          const [day, month, year] = parts.map(Number);
          // month - 1 because JavaScript months are 0-based
          return new Date(Date.UTC(year, day - 1, month));
        }

        throw new Error('Invalid date format. Please use DD/MM/YYYY or select from calendar');
      };

      const formatDate = (date) => {
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
      };

      const startDate = parseDate(formData.startDate);
      const endDate = parseDate(formData.endDate);

      // Add date validation logging
      console.log('Original Input:', {
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      console.log('Parsed Dates:', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        return;
      }

      // Normalize dates to start of day for comparison
      const startDateOnly = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate()
      ));
      const endDateOnly = new Date(Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate()
      ));

      if (startDateOnly >= endDateOnly) {
        setError('End date must be after start date');
        return;
      }

      const existingTerms = terms.filter(term =>
        selectedTerm ? term.id !== selectedTerm.id : true
      );

      for (const term of existingTerms) {
        const termStart = parseDate(term.startDate);
        const termEnd = parseDate(term.endDate);

        const overlap = (
          (startDate >= termStart && startDate <= termEnd) ||
          (endDate >= termStart && endDate <= termEnd) ||
          (startDate <= termStart && endDate >= termEnd)
        );

        if (overlap) {
          setError(`Date range overlaps with ${term.term} (${term.academicYear}): ${formatDate(termStart)} - ${formatDate(termEnd)}`);
          return;
        }
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'startDate' || key === 'endDate') {
          const date = parseDate(value);
          const formatted = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
          formDataToSend.append(key, formatted);
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

  const handleChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : '';
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const currentYear = new Date().getFullYear();
  const academicYearOptions = [];
  for (let i = -1; i <= 5; i++) {
    const year = currentYear + i;
    const yearString = `${year}-${year + 1}`;
    academicYearOptions.push({ value: yearString, label: yearString });
  }

  const termOptions = ['Term 1', 'Term 2', 'Term 3'].map(term => ({
    value: term,
    label: term,
    isDisabled: !selectedTerm && existingTerms.includes(term)
  }));

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
                        <Select
                          name="academicYear"
                          value={academicYearOptions.find(option => option.value === formData.academicYear)}
                          onChange={(option, action) => handleChange(option, { ...action, name: 'academicYear' })}
                          options={academicYearOptions}
                          isClearable
                          isSearchable
                          styles={customStyles}
                          className="mt-1"
                          classNamePrefix="select"
                          placeholder="Select Academic Year"
                          required
                          // menuPlacement="top"  // This will make the menu appear above the input
                          maxMenuHeight={80}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="term"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Select Term
                        </label>
                        <Select
                          name="term"
                          value={termOptions.find(option => option.value === formData.term)}
                          onChange={(option, action) => handleChange(option, { ...action, name: 'term' })}
                          options={termOptions}
                          isClearable
                          isSearchable
                          styles={customStyles}
                          className="mt-1"
                          classNamePrefix="select"
                          placeholder="Select Term"
                          isDisabled={!!selectedTerm}
                          required
                          maxMenuHeight={80}
                          menuPlacement="top" 
                        />
                      </div>

                      {formData.term && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.term} Dates
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

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
