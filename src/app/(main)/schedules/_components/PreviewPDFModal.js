import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import SchedulePDF from './SchedulePDF';

export default function PreviewPDFModal({ isOpen, onClose, pdfProps }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pdfProps) {
      try {
        setIsLoading(true);
        // Use the custom PDF generator if provided
        const PDFGenerator = pdfProps.pdfGenerator || SchedulePDF;
        const doc = PDFGenerator(pdfProps);
        setPdfUrl(doc.output('datauristring'));
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, pdfProps]);

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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Preview Schedule
                  </Dialog.Title>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const PDFGenerator = pdfProps.pdfGenerator || SchedulePDF;
                        const doc = PDFGenerator(pdfProps);
                        doc.save(`Schedule_${pdfProps.selectedSection || 'All'}_${pdfProps.activeTerm?.term || ''}.pdf`);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="h-[800px] w-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <iframe
                      src={pdfUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
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