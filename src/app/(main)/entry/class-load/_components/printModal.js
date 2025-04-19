import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { getTermDetails } from '../_actions';

export default function PrintModal({ isOpen, onClose, courses, onPrint }) {
  const [portalTarget, setPortalTarget] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [termDetails, setTermDetails] = useState([]);
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setPortalTarget(document.body);
    loadTermDetails();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadTermDetails = async () => {
    try {
      setIsTermLoading(true);
      const { success, terms } = await getTermDetails([1, 2, 3]);
      if (success) {
        setTermDetails(terms);
      }
    } catch (error) {
      console.error('Error loading terms:', error);
    } finally {
      setIsTermLoading(false);
    }
  };

  const courseOptions = courses.map(course => ({
    value: course,
    label: `${course.courseCode} - ${course.courseTitle}`
  }));

  const termOptions = [1, 2, 3].map(termNum => {
    const termDetail = termDetails.find(t => t.term === `Term ${termNum}`);
    return {
      value: {
        term: termNum,
        termName: `Term ${termNum}`,
        sy: termDetail?.academicYear || 'Not Set'
      },
      label: `Term ${termNum} (${termDetail?.academicYear || 'Not Set'})`
    };
  });

  const handleCourseSelect = async (selected) => {
    setSelectedCourse(selected.value);
    setPdfDoc(null); // Reset PDF when course changes
  };

  const handleTermSelect = async (selected) => {
    setSelectedTerm(selected.value);
    if (selectedCourse) {
      const doc = await onPrint(selectedCourse, selected.value, true);
      setPdfDoc(doc);
      // Create and set PDF URL
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    }
  };

  // Cleanup URL when component unmounts or when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = () => {
    if (pdfDoc && selectedCourse && selectedTerm) {
      pdfDoc.save(`class-load-${selectedCourse.courseCode}-${selectedTerm.sy}-Term${selectedTerm.term}.pdf`);
    }
  };

  const customSelectStyles = {
    menu: (provided) => ({
      ...provided,
      zIndex: 9999999
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999999
    }),
    option: (provided) => ({
      ...provided,
      color: '#000000'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#000000'
    })
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-2 sm:px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full sm:my-4 sm:max-w-3xl sm:p-6 max-h-[90vh] flex flex-col">
                <div className="absolute right-0 top-0 pr-2 sm:pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 pr-8">
                        Print Class Load
                      </Dialog.Title>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Course to Print
                          </label>
                          <Select
                            options={courseOptions}
                            onChange={handleCourseSelect}
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="Select a course..."
                            styles={customSelectStyles}
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                          />
                        </div>

                        {selectedCourse && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Term
                            </label>
                            {!isTermLoading && (
                              <Select
                                options={termOptions}
                                onChange={handleTermSelect}
                                className="basic-single"
                                classNamePrefix="select"
                                placeholder="Select a term..."
                                styles={customSelectStyles}
                                menuPortalTarget={portalTarget}
                                menuPosition="fixed"
                              />
                            )}
                          </div>
                        )}

                        {pdfDoc && (
                          <div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 mb-2">
                              <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#323E8F] hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                {isMobile ? 'Download to View PDF' : 'Download PDF'}
                              </button>
                            </div>
                            {!isMobile && (
                              <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(60vh - 200px)' }}>
                                <iframe
                                  src={pdfUrl}
                                  type="application/pdf"
                                  className="w-full h-full"
                                  title="PDF Preview"
                                />
                              </div>
                            )}
                            {isMobile && (
                              <div className="text-center p-4 border rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-600">
                                  PDF preview is not available on mobile devices. Please download the PDF to view it.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
