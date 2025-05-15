import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import generatePDF from './SchedulePDF';

export default function PreviewPDFModal({ isOpen, onClose, pdfProps }) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    async function generatePreview() {
      if (isOpen) {
        try {
          setIsLoading(true);
          // Use the provided PDF generator or fall back to default
          const pdfGenerator = pdfProps.pdfGenerator || generatePDF;
          const doc = await pdfGenerator(pdfProps, true);
          
          // Ensure doc is a jsPDF instance
          if (doc && typeof doc.output === 'function') {
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
          } else {
            console.error('Invalid PDF document returned');
          }
        } catch (error) {
          console.error('Error generating PDF:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    generatePreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [isOpen, pdfProps]);

  const handleDownload = async () => {
    try {
      const pdfGenerator = pdfProps.pdfGenerator || generatePDF;
      const doc = await pdfGenerator(pdfProps, false);
      // The generator will handle the saving internally
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Preview Schedule
                  </Dialog.Title>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#323E8F] dark:bg-[#4151B0] rounded-md hover:bg-[#35408E] dark:hover:bg-[#4B5DC0] transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="h-[800px] w-full bg-white dark:bg-gray-700 rounded-lg">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 'none', backgroundColor: 'white' }}
                      src={pdfUrl}
                      type="application/pdf"
                    />
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}