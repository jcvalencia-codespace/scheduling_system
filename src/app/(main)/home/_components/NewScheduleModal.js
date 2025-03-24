'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getScheduleFormData, createSchedule, getActiveTerm } from '../_actions';
import Swal from 'sweetalert2';

// Add these constants at the top of your component
// Add onScheduleCreated prop to the component definition
export default function NewScheduleModal({ isOpen, onClose, onScheduleCreated }) {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const studentTypes = [
    'Continuing Students',
    'Freshmen',
    'Student Athletes',
    'Transferees',
    'Irregular Students'
  ];
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 7;
    const endHour = 22;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 20) {
        const formattedHour = hour % 12 || 12;
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedMinutes = minutes.toString().padStart(2, '0');

        slots.push({
          value: `${hour.toString().padStart(2, '0')}:${formattedMinutes} ${period}`, // Added period to value
          label: `${formattedHour}:${formattedMinutes} ${period}`
        });
      }
    }
    return slots;
  };
  const [termInfo, setTermInfo] = useState(null);
  const timeSlots = generateTimeSlots();
  const scheduleTypes = ['Lecture', 'Laboratory', 'Tutorial'];
  const currentYear = new Date().getFullYear();
  const schoolYear = `${currentYear}-${currentYear + 1}`;

  const [formData, setFormData] = useState({
    sections: [],
    faculty: [],
    subjects: [],
    rooms: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedValues, setSelectedValues] = useState({
    term: '',
    section: '',
    faculty: '',
    subject: '',
    room: '',
    classLimit: '',
    studentType: '',
    days: '',
    scheduleType: 'lecture',
    timeFrom: '',
    timeTo: '',
    isPaired: false,
    isMultipleSections: false,

  });

  // Update useEffect to fetch both form data and term info
  // Update useEffect to properly handle the term data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [formResponse, termResponse] = await Promise.all([
          getScheduleFormData(),
          getActiveTerm()
        ]);
  
        if (formResponse.error) {
          throw new Error(formResponse.error);
        }

        // Log term response for debugging
        console.log('Term Response:', termResponse);

        // Check if term exists and has required properties
        if (!termResponse.term || !termResponse.term.id) {
          throw new Error('No active term found');
        }

        setFormData(formResponse);
        setTermInfo({
          _id: termResponse.term.id, // Use the id from the response
          academicYear: termResponse.term.academicYear,
          term: termResponse.term.term
        });
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Update the School Year and Term Info section
  <div className="bg-blue-50 p-4 rounded-lg mb-6">
    <div className="space-y-1 text-black">
      <div className="flex gap-2">
        <span className="font-medium">School Year:</span>
        <span>{termInfo?.academicYear || schoolYear}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-medium">Term:</span>
        <span>{termInfo?.term || 'Loading...'}</span>
      </div>
    </div>
  </div>

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSave = async () => {
    try {
      if (!termInfo?._id) {
        throw new Error('No active term found. Please contact an administrator.');
      }
  
      // Validate required fields
      const requiredFields = ['section', 'faculty', 'subject', 'room', 'classLimit', 'studentType', 'days', 'timeFrom', 'timeTo'];
      const emptyFields = requiredFields.filter(field => !selectedValues[field]);
      
      if (emptyFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      }
  
      const scheduleData = {
        ...selectedValues,
        term: termInfo._id,
        days: [selectedValues.days],
        classLimit: parseInt(selectedValues.classLimit, 10),
        isActive: true
      };
  
      const response = await createSchedule(scheduleData);
      if (response.error) {
        throw new Error(response.error);
      }
  
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Schedule has been created successfully.',
        confirmButtonColor: '#3B82F6'
      });
  
      // Call the onScheduleCreated callback to refresh schedules
      if (onScheduleCreated) {
        onScheduleCreated();
      }
  
      clearForm();
      onClose();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message || 'Something went wrong!',
        confirmButtonColor: '#3B82F6'
      });
      setError(error.message);
    }
  };

  const clearForm = () => {
    setSelectedValues({
      term: '',
      section: '',
      faculty: '',
      subject: '',
      room: '',
      classLimit: '',
      studentType: '',
      days: '',
      scheduleType: 'lecture',
      timeFrom: '',
      timeTo: '',
      isPaired: false,
      isMultipleSections: false,
    });
    setError(null);
  };
  // Update the select elements in your JSX
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        clearForm();
        onClose();
      }}>        <Transition.Child
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-black mb-4">
                  New Schedule
                </Dialog.Title>

                {/* School Year and Term Info */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="space-y-1 text-black">
                    <div className="flex gap-2">
                      <span className="font-medium">School Year:</span>
                      <span>{termInfo?.academicYear || schoolYear}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Term:</span>
                      <span className="term-display">{termInfo?.term || 'Loading...'}</span>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6 mb-6">

                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="checkbox"
                      name="isPaired"
                      checked={selectedValues.isPaired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Pairing Schedule</span>
                  </label>
                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="checkbox"
                      name="isMultipleSections"
                      checked={selectedValues.isMultipleSections}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Multiple Sections</span>
                  </label>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Section</label>
                      <select
                        name="section"
                        value={selectedValues.section}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Section</option>
                        {formData.sections.map((section) => (
                          <option key={section._id} value={section._id}>
                            {section.sectionName} - {section.courseName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Faculty</label>
                      <select
                        name="faculty"
                        value={selectedValues.faculty}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Faculty</option>
                        {formData.faculty.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Subject</label>
                      <select
                        name="subject"
                        value={selectedValues.subject}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Subject</option>
                        {formData.subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Class Limit</label>
                      <input
                        type="number"
                        name="classLimit"
                        value={selectedValues.classLimit}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter class limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Student Type</label>
                      <select
                        name="studentType"
                        value={selectedValues.studentType}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select Student Type</option>
                        {studentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Days of Week</label>
                        <select
                          name="days"
                          value={selectedValues.days}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select a Day</option>
                          {weekDays.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>


                      <div className="pt-4">
                        <label className="block text-sm font-medium text-black mb-1">Time From</label>
                        <select
                          name="timeFrom"
                          value={selectedValues.timeFrom}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select Time From</option>
                          {timeSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>


                      <div className="pt-4">
                        <label className="block text-sm font-medium text-black mb-1">Time To</label>
                        <select
                          name="timeTo"
                          value={selectedValues.timeTo}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select Time To</option>
                          {timeSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Room</label>
                      <select
                        name="room"
                        value={selectedValues.room}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Room</option>
                        {formData.rooms.map((room) => (
                          <option key={room._id} value={room._id}>
                            {room.roomName || room.name} ({room.capacity} capacity)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Schedule Type</label>
                      <select
                        name="scheduleType"
                        value={selectedValues.scheduleType}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        {scheduleTypes.map((type) => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 border border-gray-300"
                    onClick={() => {
                      clearForm();
                      onClose();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}