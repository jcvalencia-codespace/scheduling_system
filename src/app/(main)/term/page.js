'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import AddEditTermModal from './_components/AddEditTermModal';
import { getTerms, activateTerm, deactivateTerm, removeTerm, endAllTerms, toggleTermVisibility, getAllAcademicYears } from './_actions';
import Swal from 'sweetalert2';
import { useLoading } from '../../context/LoadingContext';
import NoData from '@/app/components/NoData';

export default function TermPage() {
  const [terms, setTerms] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleYearChange = async (year) => {
    try {
      const result = await Swal.fire({
        title: 'Change Academic Year?',
        text: `This will show terms from ${year} and hide current terms. Continue?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#323E8F',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, change year'
      });

      if (result.isConfirmed) {
        const response = await toggleTermVisibility(year);
        if (response.error) {
          throw new Error(response.error);
        }
        await fetchTerms();
        Swal.fire({
          icon: 'success',
          title: 'Academic Year Changed',
          text: `Now showing terms from ${year}`,
          confirmButtonColor: '#323E8F'
        });
      }
    } catch (error) {
      console.error('Error changing academic year:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to change academic year',
        confirmButtonColor: '#323E8F'
      });
    }
  };

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const [termsResponse, yearsResponse] = await Promise.all([
        getTerms(),
        getAllAcademicYears()
      ]);

      if (termsResponse.error) {
        throw new Error(termsResponse.error);
      }
      if (yearsResponse.error) {
        throw new Error(yearsResponse.error);
      }

      setTerms(termsResponse.terms || []);
      setAvailableYears(yearsResponse.years || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load data',
        confirmButtonColor: '#323E8F'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (id, currentStatus, termInfo) => {
    try {
      const activeTerm = terms.find(t => t.status === 'Active');
      
      if (currentStatus === 'Active') {
        const result = await Swal.fire({
          title: 'Deactivate Term?',
          text: 'Are you sure you want to deactivate this term? This will leave no active term in the system.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#323E8F',
          confirmButtonText: 'Yes, deactivate it'
        });
        
        if (!result.isConfirmed) return;
        
        const response = await deactivateTerm(id);
        if (response.error) {
          throw new Error(response.error);
        }
        await fetchTerms();
        
        Swal.fire({
          icon: 'success',
          title: 'Term Deactivated',
          text: 'The term has been deactivated successfully.',
          confirmButtonColor: '#323E8F'
        });
      } else {
        let confirmText = `Are you sure you want to activate ${termInfo.term} (${termInfo.academicYear})?`;
        if (activeTerm) {
          confirmText += `\n\nThis will deactivate the current active term: ${activeTerm.term} (${activeTerm.academicYear})`;
        }
        
        const result = await Swal.fire({
          title: 'Activate Term?',
          text: confirmText,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#323E8F',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, activate it'
        });
        
        if (!result.isConfirmed) return;
        
        const response = await activateTerm(id);
        if (response.error) {
          throw new Error(response.error);
        }
        await fetchTerms();
        
        Swal.fire({
          icon: 'success',
          title: 'Term Activated',
          text: activeTerm 
            ? 'The term has been activated and the previous active term has been deactivated.'
            : 'The term has been activated successfully.',
          confirmButtonColor: '#323E8F'
        });
      }
    } catch (error) {
      console.error('Error managing term status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update term status',
        confirmButtonColor: '#323E8F'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this term!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#323E8F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await removeTerm(id);
        if (response.error) {
          throw new Error(response.error);
        }
        await fetchTerms();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Term has been deleted.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error deleting term:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete term',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const handleEndAllTerms = async () => {
    const result = await Swal.fire({
      title: 'End All Terms?',
      text: 'Are you sure you want to end all active terms? This will set all terms to inactive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#323E8F',
      confirmButtonText: 'Yes, end all terms'
    });

    if (result.isConfirmed) {
      try {
        const response = await endAllTerms();
        if (response.error) {
          throw new Error(response.error);
        }
        await fetchTerms();
        Swal.fire({
          icon: 'success',
          title: 'All Terms Ended',
          text: 'All active terms have been set to inactive.',
          confirmButtonColor: '#323E8F'
        });
      } catch (error) {
        console.error('Error ending all terms:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to end all terms',
          confirmButtonColor: '#323E8F'
        });
      }
    }
  };

  const filteredTerms = useMemo(() => {
    const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    
    return terms
      .filter((term) =>
        Object.values(term).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => {
        if (a.academicYear !== b.academicYear) {
          return a.academicYear.localeCompare(b.academicYear);
        }
        return termOrder[a.term] - termOrder[b.term];
      });
  }, [terms, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Term Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage academic terms and their schedules.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-row sm:items-center sm:space-x-2">
            <select
              onChange={(e) => handleYearChange(e.target.value)}
              className="mr-2 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-[#323E8F] focus:outline-none focus:ring-[#323E8F] sm:text-sm text-black"
            >
              <option value="">Select Academic Year</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleEndAllTerms}
              className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all"
            >
              <span className="mr-2">✖</span> End All Terms
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center rounded-lg bg-[#323E8F] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#2A347A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F] transition-all"
            >
              <span className="mr-2">+</span> Add Term
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">

              <div className="mt-2 sm:mt-0 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            #
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Academic Year
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Term
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Start Date
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            End Date
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredTerms.length === 0 ? (
                          <tr>
                            <td colSpan="6">
                              <NoData 
                                message={searchQuery ? "No matching terms" : "No terms yet"} 
                                description={searchQuery 
                                  ? "Try adjusting your search term" 
                                  : "Add a term to get started"
                                }
                              />
                            </td>
                          </tr>
                        ) : (
                          filteredTerms.map((term, index) => (
                            <tr key={term.id}>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                {term.academicYear}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {term.term}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatDate(term.startDate)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatDate(term.endDate)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    className="inline-flex items-center justify-center w-24 px-3 py-2 text-sm font-medium rounded-lg text-[#323E8F] bg-gray-100 hover:text-[#2A347A] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
                                    onClick={() => {
                                      setSelectedTerm(term);
                                      setIsAddModalOpen(true);
                                    }}
                                  >
                                    <PencilSquareIcon className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center w-24 px-3 py-2 text-sm font-medium rounded-lg text-red-600 bg-gray-100 hover:text-red-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                                    onClick={() => handleDelete(term.id)}
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                  <button
                                    className={`inline-flex items-center justify-center w-24 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                      term.status === 'Active'
                                        ? 'text-green-600 bg-gray-100 hover:text-green-700 hover:bg-gray-200 focus:ring-green-600'
                                        : 'text-gray-600 bg-gray-100 hover:text-gray-700 hover:bg-gray-200 focus:ring-gray-600'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                    onClick={() =>
                                      handleActivate(term.id, term.status, {
                                        term: term.term,
                                        academicYear: term.academicYear,
                                      })
                                    }
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    {term.status === 'Active' ? 'Active' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <AddEditTermModal
              open={isAddModalOpen}
              setOpen={setIsAddModalOpen}
              title={selectedTerm ? 'Edit Term' : 'Add Term'}
              selectedTerm={selectedTerm}
              onSuccess={fetchTerms}
              terms={terms}
            />
          </div>
        </div>
      </div>
    </div>
  );
}