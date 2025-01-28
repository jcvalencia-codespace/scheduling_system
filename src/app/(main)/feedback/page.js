'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { submitFeedback, getUserFeedback } from './_actions';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function FeedbackPage() {
  const router = useRouter();
  const [userFeedback, setUserFeedback] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserFeedback();
  }, []);

  async function loadUserFeedback() {
    const result = await getUserFeedback();
    if (result.success) {
      setUserFeedback(result.feedback);
    }
  }

  const resetForm = () => {
    const form = document.querySelector('form');
    form.reset();
    // Reset dropdowns to placeholder values
    document.getElementById('type').value = '';
    document.getElementById('priority').value = '';
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const result = await submitFeedback(formData);
      
      if (result.error) {
        setError(result.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error,
          confirmButtonColor: '#323E8F'
        });
      } else {
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Your feedback has been submitted successfully. Thank you for helping us improve!',
          confirmButtonColor: '#323E8F'
        });

        // Reset form and dropdowns
        resetForm();
        
        // Update feedback list if needed
        setUserFeedback([result.feedback, ...userFeedback]);
      }
    } catch (error) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Send Feedback</h1>
            <p className="mt-2 text-sm text-gray-700">
              We value your feedback! Help us improve SchedNU by sharing your thoughts,
              reporting issues, or suggesting new features.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#323E8F]" />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white shadow-lg rounded-lg">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-black"
                  >
                    Subject
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                      placeholder="Brief title for your feedback"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-black"
                  >
                    Feedback Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    defaultValue=""
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                  >
                    <option value="" disabled>Select feedback type</option>
                    <option value="suggestion">Enhancement Suggestion</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-black"
                  >
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    required
                    defaultValue=""
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                  >
                    <option value="" disabled>Select priority level</option>
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-black"
                  >
                    Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm text-black"
                      placeholder="Please describe your feedback in detail. If reporting a bug, include steps to reproduce the issue."
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-[#323E8F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>


        <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center space-x-2 text-sm text-black">
            <EnvelopeIcon className="h-5 w-5" />
            <span>
              You can also reach us directly at{' '}
              <a
                href="mailto:schednu@gmail.com"
                className="text-[#323E8F] hover:text-[#35408E]"
              >
                schednu@gmail.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
