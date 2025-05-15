'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { editApprovedAdminHours } from '../_actions' // Only import editApprovedAdminHours
import Swal from 'sweetalert2'
import moment from 'moment'
import Select from 'react-select'

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const time = moment()
    .startOf('day')
    .add(7, 'hours')
    .add(i * 20, 'minutes')
  return {
    value: time.format('h:mm A'),
    label: time.format('h:mm A'),
  }
})

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#cbd5e1',
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#f1f5f9' : null,
    color: state.isSelected ? 'white' : '#1e293b',
  }),
}

export default function EditAdminHoursModal({ isOpen, onClose, adminHours, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: ''
  })

  useEffect(() => {
    if (adminHours) {
      setFormData({
        day: adminHours.day,
        startTime: adminHours.startTime || adminHours.timeFrom,
        endTime: adminHours.endTime || adminHours.timeTo
      })
    }
  }, [adminHours])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Add validation for equal times
    if (formData.startTime === formData.endTime) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Time',
        text: 'Start time and end time cannot be the same',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }
    // Prevent if start time is the same or after the end time
    if (formData.startTime >= formData.endTime) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Time',
        text: 'Start time must be earlier than end time.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }


    setIsSubmitting(true)

    try {
      const adminHoursId = adminHours.parentId;
      const slotId = adminHours._id;

      console.log('Editing admin hours:', {
        adminHoursId,
        slotId,
        formData,
        adminHours
      });

      const response = await editApprovedAdminHours(
        adminHoursId,
        slotId,
        formData
      );

      if (response.error) {
        throw new Error(response.error)
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Admin hours updated successfully',
        timer: 1500,
        showConfirmButton: false
      });

      if (onSuccess) {
        onSuccess(response.hours);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating admin hours:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update admin hours'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-lg">
                <div className="absolute right-4 top-4 z-10">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-6 py-5">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-5">
                    Edit Admin Hours
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                        Day
                      </label>
                      <Select
                        id="day"
                        name="day"
                        value={{ value: formData.day, label: formData.day }}
                        onChange={(option) => handleChange({ target: { name: 'day', value: option.value } })}
                        options={[
                          { value: 'Monday', label: 'Monday' },
                          { value: 'Tuesday', label: 'Tuesday' },
                          { value: 'Wednesday', label: 'Wednesday' },
                          { value: 'Thursday', label: 'Thursday' },
                          { value: 'Friday', label: 'Friday' },
                          { value: 'Saturday', label: 'Saturday' }
                        ]}
                        styles={selectStyles}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <Select
                        id="startTime"
                        name="startTime"
                        value={{ value: formData.startTime, label: formData.startTime }}
                        onChange={(option) => handleChange({ target: { name: 'startTime', value: option.value } })}
                        options={TIME_OPTIONS}
                        styles={selectStyles}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <Select
                        id="endTime"
                        name="endTime"
                        value={{ value: formData.endTime, label: formData.endTime }}
                        onChange={(option) => handleChange({ target: { name: 'endTime', value: option.value } })}
                        options={TIME_OPTIONS}
                        styles={selectStyles}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}