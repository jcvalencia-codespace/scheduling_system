'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import AddEditTermModal from './_components/AddEditTermModal';
import { getTerms, activateTerm, deactivateTerm, removeTerm } from './_actions';
import Swal from 'sweetalert2';
import { useLoading } from '../../context/LoadingContext';

export default function TermPage() {
  const [terms, setTerms] = useState([]);
  const { isLoading, setIsLoading } = useLoading();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await getTerms();
      if (response.error) {
        throw new Error(response.error);
      }
      setTerms(response.terms || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load terms',
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
        
        // Call API to deactivate
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
        // Activating a term
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
        
        // Call API to activate
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

  // Filtering function
  const filteredTerms = useMemo(() => {
    return terms.filter((term) =>
      Object.values(term).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
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
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(null);
                setIsAddModalOpen(true);
              }}
              className="block rounded-md bg-[#323E8F] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#323E8F]"
            >
              Add Term
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="rounded-md border-gray-300 py-1.5 text-sm focus:border-[#323E8F] focus:ring-[#323E8F]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>

              <div className="mt-2 sm:mt-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                />
              </div>
            </div>

            {/* Table */}
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
                        {filteredTerms.map((term, index) => (
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
                              <div className="flex justify-end items-center space-x-3">
                                <button
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-[#323E8F] hover:text-[#35408E] hover:bg-[#323E8F]/5 transition-colors duration-200"
                                  onClick={() => {
                                    setSelectedTerm(term);
                                    setIsAddModalOpen(true);
                                  }}
                                >
                                  <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                                  onClick={() => handleDelete(term.id)}
                                >
                                  <TrashIcon className="h-4 w-4 mr-1.5" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                    term.status === 'Active'
                                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                                  }`}
                                  onClick={() =>
                                    handleActivate(term.id, term.status, {
                                      term: term.term,
                                      academicYear: term.academicYear,
                                    })
                                  }
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                  <span>{term.status === 'Active' ? 'Active' : 'Activate'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Term Modal */}
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