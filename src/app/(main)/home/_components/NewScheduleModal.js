'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getScheduleFormData, createSchedule, getActiveTerm, updateSchedule } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import useAuthStore from '@/store/useAuthStore';



export default function NewScheduleModal({
  isOpen,
  onClose,
  onScheduleCreated,
  editMode = false,
  scheduleData = null
}) {
  const { user } = useAuthStore(); // Add this line
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const studentTypes = [
    'Continuing Students',
    'Freshmen',
    'Student Athletes',
    'Transferees',
    'Irregular Students'
  ];
  const [pairedSchedule, setPairedSchedule] = useState({
    days: '',
    timeFrom: '',
    timeTo: '',
    room: '',
    scheduleType: 'lecture'
  });
  // Update the customStyles object
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      backgroundColor: 'white',
      borderColor: '#E5E7EB',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6B7280',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : 'black',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 100,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px', // Set maximum height
      overflowY: 'auto', // Enable vertical scrolling
      '&::-webkit-scrollbar': {
        width: '8px'
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1'
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px'
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555'
      }
    })
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 7;
    const endHour = 22;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 20) {
        const hour12 = hour % 12 || 12; // Convert to 12-hour format
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedMinutes = minutes.toString().padStart(2, '0');

        slots.push({
          value: `${hour12}:${formattedMinutes} ${period}`, // Use 12-hour format in value
          label: `${hour12}:${formattedMinutes} ${period}`
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
  const sectionOptions = formData.sections.map(section => ({
    value: section._id,
    label: section.displayName,
    courseInfo: section.course,
    yearLevel: section.yearLevel
  }));

  const facultyOptions = formData.faculty.map(f => ({
    value: f._id,
    label: f.fullName
  }));

  const subjectOptions = formData.subjects.map(subject => ({
    value: subject._id,
    label: subject.displayName
  }));

  // Update the roomOptions mapping
  const roomOptions = formData.rooms.map(room => ({
    value: room._id,
    label: `${room.roomCode} - ${room.roomName || room.name} (${room.capacity} capacity)`
  }));

  const dayOptions = weekDays.map(day => ({
    value: day,
    label: day
  }));

  const studentTypeOptions = studentTypes.map(type => ({
    value: type,
    label: type
  }));

  const scheduleTypeOptions = scheduleTypes.map(type => ({
    value: type.toLowerCase(),
    label: type
  }));

  const timeSlotOptions = timeSlots.map(slot => ({
    value: slot.value,
    label: slot.label
  }));

  // Add this handler for react-select changes
  const handleSelectChange = (selectedOption, { name }) => {
    setSelectedValues(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ''
    }));
  };
  const handlePairedScheduleChange = (selectedOption, { name }) => {
    setPairedSchedule(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ''
    }));
  };
  useEffect(() => {
    if (editMode && scheduleData && isOpen) {
      const formatTimeForEdit = (timeStr) => {
        if (!timeStr) return '';
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
      };
  
      // Main schedule is always the first slot
      const mainSlot = scheduleData.scheduleSlots[0];
      // Paired schedule is the second slot if it exists
      const pairedSlot = scheduleData.scheduleSlots[1];
  
      setSelectedValues({
        id: scheduleData._id,
        term: scheduleData.term?._id || '',
        section: scheduleData.section?._id || '',
        faculty: scheduleData.faculty?._id || '',
        subject: scheduleData.subject?._id || '',
        room: mainSlot?.room?._id || '', // Update this line
        classLimit: scheduleData.classLimit?.toString() || '',
        studentType: scheduleData.studentType || '',
        days: mainSlot?.days?.[0] || '',
        scheduleType: mainSlot?.scheduleType || 'lecture',
        timeFrom: formatTimeForEdit(mainSlot?.timeFrom),
        timeTo: formatTimeForEdit(mainSlot?.timeTo),
        isPaired: scheduleData.isPaired || false,
        isMultipleSections: scheduleData.isMultipleSections || false
      });
  
      if (pairedSlot) {
        setPairedSchedule({
          days: pairedSlot.days[0] || '',
          timeFrom: formatTimeForEdit(pairedSlot.timeFrom),
          timeTo: formatTimeForEdit(pairedSlot.timeTo),
          room: pairedSlot.room?._id || '', // Update this line
          scheduleType: pairedSlot.scheduleType || 'lecture'
        });
      }
    }
  }, [editMode, scheduleData, isOpen]);

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
  
      // Format time values
      const formatTimeValue = (timeValue) => {
        const [time, period] = timeValue.split(' ');
        const [hours, minutes] = time.split(':');
        const formattedHours = hours.padStart(2, '0');
        return `${formattedHours}:${minutes} ${period}`;
      };
  
      // Validate paired schedule if enabled
      if (selectedValues.isPaired) {
        if (selectedValues.days === pairedSchedule.days) {
          throw new Error('Paired schedule cannot be on the same day as the main schedule');
        }
  
        const pairedRequiredFields = ['days', 'timeFrom', 'timeTo', 'room'];
        const emptyPairedFields = pairedRequiredFields.filter(field => !pairedSchedule[field]);
  
        if (emptyPairedFields.length > 0) {
          throw new Error(`Please fill in all paired schedule fields: ${emptyPairedFields.join(', ')}`);
        }
      }
  
      const scheduleData = {
        ...selectedValues,
        term: termInfo._id,
        days: [selectedValues.days],
        classLimit: parseInt(selectedValues.classLimit, 10),
        timeFrom: formatTimeValue(selectedValues.timeFrom),
        timeTo: formatTimeValue(selectedValues.timeTo),
        isActive: true,
        userId: user._id, // Add user ID
        pairedSchedule: selectedValues.isPaired ? {
          ...pairedSchedule,
          timeFrom: formatTimeValue(pairedSchedule.timeFrom),
          timeTo: formatTimeValue(pairedSchedule.timeTo),
          days: [pairedSchedule.days]
        } : null
      };
  
      const response = editMode
      ? await updateSchedule(scheduleData.id || scheduleData._id, scheduleData)
      : await createSchedule(scheduleData);
  
      if (response.error) {
        throw new Error(response.error);
      }
  
      await Swal.fire({
        title: editMode ? 'Updated!' : 'Created!',
        text: `Schedule has been ${editMode ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        timer: 1500
      });
  
      onClose();
      clearForm();
      onScheduleCreated();
    } catch (error) {
      console.error(editMode ? 'Error updating schedule:' : 'Error creating schedule:', error);
      await Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error'
      });
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
    setPairedSchedule({
      days: '',
      timeFrom: '',
      timeTo: '',
      room: '',
      scheduleType: 'lecture'
    });
    setError(null);
  };

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
                <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-5">
                  {editMode ? 'Edit Schedule' : 'New Schedule Entry'}
                </Dialog.Title>

             <div className="max-h-[70vh] overflow-y-auto  p-6">
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
                      <Select
                        name="section"
                        value={sectionOptions.find(option => option.value === selectedValues.section)}
                        onChange={(option) => handleSelectChange(option, { name: 'section' })}
                        isSearchable={true}
                        maxMenuHeight={200}
                        // menuPlacement="auto"
                        // menuPosition="fixed"
                        options={sectionOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select a Section"
                        isClearable
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Faculty</label>
                      <Select
                        name="faculty"
                        value={facultyOptions.find(option => option.value === selectedValues.faculty)}
                        onChange={(option) => handleSelectChange(option, { name: 'faculty' })}
                        options={facultyOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select a Faculty"
                        isClearable
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Subject</label>
                      <Select
                        name="subject"
                        value={subjectOptions.find(option => option.value === selectedValues.subject)}
                        onChange={(option) => handleSelectChange(option, { name: 'subject' })}
                        options={subjectOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select a Subject"
                        isClearable
                      />
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
                      <Select
                        name="studentType"
                        value={studentTypeOptions.find(option => option.value === selectedValues.studentType)}
                        onChange={(option) => handleSelectChange(option, { name: 'studentType' })}
                        options={studentTypeOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select Student Type"
                        isClearable
                        isSearchable={true}
                        menuPlacement="top"  // This will make the menu appear above the input
                        maxMenuHeight={200}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Days of Week</label>
                        <Select
                          name="days"
                          value={dayOptions.find(option => option.value === selectedValues.days)}
                          onChange={(option) => handleSelectChange(option, { name: 'days' })}
                          options={dayOptions}
                          styles={customStyles}
                          className="text-black"
                          placeholder="Select a Day"
                          isClearable
                        />
                      </div>


                      <div className="pt-4">
                        <label className="block text-sm font-medium text-black mb-1">Time From</label>
                        <Select
                          name="timeFrom"
                          value={timeSlotOptions.find(option => option.value === selectedValues.timeFrom)}
                          onChange={(option) => handleSelectChange(option, { name: 'timeFrom' })}
                          options={timeSlotOptions}
                          styles={customStyles}
                          className="text-black"
                          placeholder="Select Time From"
                          isClearable
                        />
                      </div>


                      <div className="pt-4">
                        <label className="block text-sm font-medium text-black mb-1">Time To</label>
                        <Select
                          name="timeTo"
                          value={timeSlotOptions.find(option => option.value === selectedValues.timeTo)}
                          onChange={(option) => handleSelectChange(option, { name: 'timeTo' })}
                          options={timeSlotOptions}
                          styles={customStyles}
                          className="text-black"
                          placeholder="Select Time To"
                          isClearable
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Room</label>
                      <Select
                        name="room"
                        value={roomOptions.find(option => option.value === selectedValues.room)}
                        onChange={(option) => handleSelectChange(option, { name: 'room' })}
                        options={roomOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select a Room"
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Schedule Type</label>
                      <Select
                        name="scheduleType"
                        value={scheduleTypeOptions.find(option => option.value === selectedValues.scheduleType)}
                        onChange={(option) => handleSelectChange(option, { name: 'scheduleType' })}
                        options={scheduleTypeOptions}
                        styles={customStyles}
                        className="text-black"
                        placeholder="Select Schedule Type"
                        isClearable
                        isSearchable={true}
                        menuPlacement="top"  // This will make the menu appear above the input
                        maxMenuHeight={200}
                      />
                    </div>

                  </div>
                </div>
                {selectedValues.isPaired && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Paired Schedule Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Days of Week</label>
                          <Select
                            name="days"
                            value={dayOptions.find(option => option.value === pairedSchedule.days)}
                            onChange={(option) => handlePairedScheduleChange(option, { name: 'days' })}
                            options={dayOptions}
                            styles={customStyles}
                            className="text-black"
                            placeholder="Select a Day"
                            isClearable
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Room</label>
                          <Select
                            name="room"
                            value={roomOptions.find(option => option.value === pairedSchedule.room)}
                            onChange={(option) => handlePairedScheduleChange(option, { name: 'room' })}
                            options={roomOptions}
                            styles={customStyles}
                            className="text-black"
                            placeholder="Select a Room"
                            isClearable
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Time From</label>
                          <Select
                            name="timeFrom"
                            value={timeSlotOptions.find(option => option.value === pairedSchedule.timeFrom)}
                            onChange={(option) => handlePairedScheduleChange(option, { name: 'timeFrom' })}
                            options={timeSlotOptions}
                            styles={customStyles}
                            className="text-black"
                            placeholder="Select Time From"
                            isClearable
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Time To</label>
                          <Select
                            name="timeTo"
                            value={timeSlotOptions.find(option => option.value === pairedSchedule.timeTo)}
                            onChange={(option) => handlePairedScheduleChange(option, { name: 'timeTo' })}
                            options={timeSlotOptions}
                            styles={customStyles}
                            className="text-black"
                            placeholder="Select Time To"
                            isClearable
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Schedule Type</label>
                          <Select
                            name="scheduleType"
                            value={scheduleTypeOptions.find(option => option.value === pairedSchedule.scheduleType)}
                            onChange={(option) => handlePairedScheduleChange(option, { name: 'scheduleType' })}
                            options={scheduleTypeOptions}
                            styles={customStyles}
                            className="text-black"
                            placeholder="Select Schedule Type"
                            isClearable
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                
                )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
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
