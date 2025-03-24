'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createSchedule, getFaculty, getSubjects, getSections, getRooms } from '../_actions';
import { toast } from 'react-hot-toast';

export default function NewScheduleModal({ isOpen, onClose, activeTerm, onScheduleCreated }) {
  const scheduleTypes = ['Lecture', 'Laboratory', 'Tutorial'];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const studentTypes = [
    "New Students only within college",
    "Continuing Students only within college",
    "Athletes only",
    "All students within college",
    "All students within university (allow cross-enrollees)",
    "None (Inactive class or thru advising only)"
  ];
  const timeSlots = (() => {
    const slots = [];
    for (let hour = 7; hour <= 21; hour++) { // 7 AM to 9 PM
      for (let minute = 0; minute < 60; minute += 20) {
        const hour12 = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'pm' : 'am';
        const minuteStr = minute.toString().padStart(2, '0');
        slots.push(`${hour12}:${minuteStr} ${ampm}`);
      }
    }
    return slots;
  })();


  const [formData, setFormData] = useState({
    termId: '',
    sectionId: '',
    facultyId: '',
    subjectId: '',
    roomId: '',
    days: [],
    timeFrom: '',
    timeTo: '',
    scheduleType: 'Lecture',
    classLimit: '',
    studentType: '',
    isPaired: false,
    isMultipleSection: false
  });

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    faculty: [],
    subjects: [],
    sections: [],
    rooms: []
  });

  useEffect(() => {
    if (activeTerm?.id) {
      setFormData(prev => ({ ...prev, termId: activeTerm.id }));
    }
  }, [activeTerm]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      console.log('Fetching options...');
      const [
        facultyResult,
        subjectsResult,
        sectionsResult,
        roomsResult
      ] = await Promise.all([
        getFaculty(),
        getSubjects(),
        getSections(),
        getRooms()
      ]);

      console.log('Results:', {
        faculty: facultyResult,
        subjects: subjectsResult,
        sections: sectionsResult,
        rooms: roomsResult
      });

      setOptions({
        faculty: facultyResult.faculty || [],
        subjects: subjectsResult.subjects || [],
        sections: sectionsResult.sections || [],
        rooms: roomsResult.rooms || []
      });
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load form options');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDaysChange = (e) => {
    const { value } = e.target;
    setFormData(prev => {
      const days = [...prev.days];
      if (days.includes(value)) {
        return { ...prev, days: days.filter(day => day !== value) };
      } else {
        return { ...prev, days: [...days, value] };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!formData.termId) {
        throw new Error('Active term is required');
      }

      console.log('Submitting schedule data:', formData);

      const result = await createSchedule(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Schedule created successfully');
      onScheduleCreated(result.schedule);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current formData:', formData);
    console.log('Active Term:', activeTerm);
  }, [formData, activeTerm]);

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

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="space-y-1 text-black">
                    <div className="flex gap-2">
                      <span className="font-medium">School Year:</span>
                      <span>{activeTerm?.academicYear}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Term:</span>
                      <span>{activeTerm?.term}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 mb-6">
                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="checkbox"
                      name="isPaired"
                      checked={formData.isPaired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Pairing Schedule</span>
                  </label>
                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="checkbox"
                      name="isMultipleSection"
                      checked={formData.isMultipleSection}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Multiple Sections</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Section</label>
                      <select
                        name="sectionId"
                        value={formData.sectionId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Section</option>
                        {options.sections.map(section => (
                          <option key={section._id} value={section._id}>
                            {section.sectionName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Faculty</label>
                      <select
                        name="facultyId"
                        value={formData.facultyId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Faculty</option>
                        {options.faculty.map(faculty => (
                          <option key={faculty._id} value={faculty._id}>
                            {`${faculty.lastName}, ${faculty.firstName}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Subject</label>
                      <select
                        name="subjectId"
                        value={formData.subjectId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Subject</option>
                        {options.subjects.map(subject => (
                          <option key={subject._id} value={subject._id}>
                            {`${subject.subjectCode} - ${subject.subjectName}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Class Limit</label>
                      <input
                        type="number"
                        name="classLimit"
                        value={formData.classLimit}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter class limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Student Type</label>
                      <select
                        name="studentType"
                        value={formData.studentType}
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

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Days of Week</label>
                      <select
                        name="days"
                        value={formData.days[0] || ''}
                        onChange={handleDaysChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Day</option>
                        {weekDays.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Room</label>
                      <select
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a Room</option>
                        {options.rooms.map(room => (
                          <option key={room._id} value={room._id}>
                            {`${room.roomCode} - ${room.roomName}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Schedule Type</label>
                      <select
                        name="scheduleType"
                        value={formData.scheduleType}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        {scheduleTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Time From</label>
                      <select
                        name="timeFrom"
                        value={formData.timeFrom}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select Time From</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Time To</label>
                      <select
                        name="timeTo"
                        value={formData.timeTo}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select Time To</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 border border-gray-300"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
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
