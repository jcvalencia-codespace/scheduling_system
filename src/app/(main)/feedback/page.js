'use client';

import { useState } from 'react';
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    type: 'suggestion',
    priority: 'normal',
    attachScreenshot: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the feedback to your backend
      console.log('Submitting feedback:', formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
      setFormData({
        subject: '',
        message: '',
        type: 'suggestion',
        priority: 'normal',
        attachScreenshot: null,
      });

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
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

        <div className="mt-8 bg-white shadow-lg rounded-lg">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                      placeholder="Brief description of your feedback"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Feedback Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm"
                      placeholder="Please provide detailed information about your feedback, including steps to reproduce if reporting a bug."
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="attachScreenshot"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Attach Screenshot (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="attachScreenshot"
                      name="attachScreenshot"
                      accept="image/*"
                      onChange={handleChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#323E8F] file:text-white hover:file:bg-[#35408E]"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Accepted formats: PNG, JPG, JPEG. Max file size: 5MB
                  </p>
                </div>
              </div>

              {showSuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Feedback submitted successfully! Thank you for helping us improve.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      subject: '',
                      message: '',
                      type: 'suggestion',
                      priority: 'normal',
                      attachScreenshot: null,
                    });
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2"
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
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <EnvelopeIcon className="h-5 w-5" />
            <span>
              You can also reach us directly at{' '}
              <a
                href="mailto:support@schednu.com"
                className="text-[#323E8F] hover:text-[#35408E]"
              >
                support@schednu.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
