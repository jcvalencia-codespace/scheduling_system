'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getScheduleFormData, createSchedule, getActiveTerm, updateSchedule, getFacultyLoad } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import useAuthStore from '@/store/useAuthStore';
import ScheduleModalSkeleton from './Skeleton';
import { XCircleIcon } from '@heroicons/react/24/outline';
import ConflictAlert from './ConflictAlert';

export default function NewScheduleModal({
  isOpen,
  onClose,
  onScheduleCreated,
  editMode = false,
  scheduleData = null
}) {
  const { user } = useAuthStore();
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
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#323E8F' : '#E5E7EB',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        borderColor: '#323E8F'
      },
      '&:focus': {
        borderColor: '#323E8F',
        boxShadow: '0 0 0 1px #323E8F'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6B7280',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#323E8F' : state.isFocused ? '#EFF6FF' : 'white',
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
      maxHeight: '200px',
      overflowY: 'auto',
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
        const hour12 = hour % 12 || 12;
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedMinutes = minutes.toString().padStart(2, '0');

        slots.push({
          value: `${hour12}:${formattedMinutes} ${period}`,
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

  const formatTimeValue = (timeValue) => {
    const [time, period] = timeValue.split(' ');
    const [hours, minutes] = time.split(':');
    const formattedHours = hours.padStart(2, '0');
    return `${formattedHours}:${minutes} ${period}`;
  };

  const [facultyLoad, setFacultyLoad] = useState({
    employmentType: 'N/A',
    totalHours: 0,
    teachingHours: 0,
    adminHours: 0
  });

  useEffect(() => {
    const loadFacultyData = async () => {
      if (selectedValues.faculty && termInfo?._id) {
        const loadData = await getFacultyLoad(selectedValues.faculty, termInfo._id);
        setFacultyLoad(loadData);
      } else {
        // Clear faculty load if no faculty selected or no term
        setFacultyLoad({
          employmentType: 'N/A',
          totalHours: 0,
          teachingHours: 0,
          adminHours: 0
        });
      }
    };

    loadFacultyData();
  }, [selectedValues.faculty, termInfo?._id]);

  const capitalizeFirstLetter = (string) => {
    if (!string) return 'N/A';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const getFacultyLoadDisplay = () => {
    const employmentType = facultyLoad.employmentType?.toLowerCase();
    const isFullTime = employmentType === 'full-time';
    const maxHours = isFullTime ? 40 : 24;
    const teachingHours = facultyLoad.teachingHours || 0;
    const adminHours = isFullTime ? maxHours - teachingHours : 0;
    const subjectCodes = facultyLoad.subjectCodes || [];

    return {
      employmentType: capitalizeFirstLetter(facultyLoad.employmentType),
      teachingHours,
      adminHours,
      totalHours: maxHours,
      subjectCodes,
      subjectCount: subjectCodes.length
    };
  };

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

        console.log('Term Response:', termResponse);

        if (!termResponse.term || !termResponse.term.id) {
          throw new Error('No active term found');
        }

        setFormData(formResponse);
        setTermInfo({
          _id: termResponse.term.id,
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

  const handleSelectChange = (selectedOption, { name }) => {
    setSelectedValues(prev => ({
      ...prev,
      [name]: name === 'section' && selectedValues.isMultipleSections
        ? (Array.isArray(selectedOption) ? selectedOption.map(opt => opt.value) : [])
        : (selectedOption ? selectedOption.value : '')
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

      const mainSlot = scheduleData.scheduleSlots[0];
      const pairedSlot = scheduleData.scheduleSlots[1];

      setSelectedValues({
        id: scheduleData._id,
        term: scheduleData.term?._id || '',
        section: scheduleData.section?._id || '',
        faculty: scheduleData.faculty?._id || '',
        subject: scheduleData.subject?._id || '',
        room: mainSlot?.room?._id || '',
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
          room: pairedSlot.room?._id || '',
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

      const requiredFields = ['section', 'subject', 'room', 'classLimit', 'studentType', 'days', 'timeFrom', 'timeTo'];
      const emptyFields = requiredFields.filter(field => !selectedValues[field]);

      if (emptyFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      }

      const classLimit = parseInt(selectedValues.classLimit, 10);
      if (isNaN(classLimit) || classLimit <= 0) {
        throw new Error('Class limit must be a positive number');
      }

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
        userId: user._id,
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

      console.log('Save response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.conflicts) {
        setConflicts(response.conflicts);
        return;
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

  const checkScheduleDuration = (conflicts) => {
    const getMinutesBetween = (timeFrom, timeTo) => {
      const [fromTime, fromPeriod] = timeFrom.split(' ');
      const [toTime, toPeriod] = timeTo.split(' ');

      let [fromHour, fromMinute] = fromTime.split(':').map(Number);
      let [toHour, toMinute] = toTime.split(':').map(Number);

      // Convert to 24-hour format
      if (fromPeriod === 'PM' && fromHour !== 12) fromHour += 12;
      if (fromPeriod === 'AM' && fromHour === 12) fromHour = 0;
      if (toPeriod === 'PM' && toHour !== 12) toHour += 12;
      if (toPeriod === 'AM' && toHour === 12) toHour = 0;

      const minutes = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute);
      return minutes > 0 ? minutes : minutes + (24 * 60); // Handle overnight schedules
    };

    const minimumDuration = 120; // 2 hours in minutes
    let totalShortDurations = 0;
    let affectedSchedules = [];

    // Process each type of conflict
    const processConflicts = (conflictArray) => {
      conflictArray.forEach(conflict => {
        const duration = getMinutesBetween(conflict.timeFrom, conflict.timeTo);
        if (duration < minimumDuration) {
          totalShortDurations++;
          affectedSchedules.push({
            type: conflict.room ? 'Room' : conflict.faculty ? 'Faculty' : 'Section',
            duration,
            details: `${duration} minutes`
          });
        }
      });
    };

    processConflicts(conflicts.roomConflicts);
    processConflicts(conflicts.facultyConflicts);
    processConflicts(conflicts.sectionConflicts);

    const currentDuration = getCurrentScheduleDuration();
    if (currentDuration < minimumDuration) {
      totalShortDurations++;
      affectedSchedules.push({
        type: 'Current Schedule',
        duration: currentDuration,
        details: `${currentDuration} minutes`
      });
    }

    return {
      isValid: totalShortDurations === 0,
      shortDurations: totalShortDurations,
      affectedSchedules
    };
  };

  const getCurrentScheduleDuration = () => {
    const getMinutesBetween = (timeFrom, timeTo) => {
      const [fromTime, fromPeriod] = timeFrom.split(' ');
      const [toTime, toPeriod] = timeTo.split(' ');

      let [fromHour, fromMinute] = fromTime.split(':').map(Number);
      let [toHour, toMinute] = toTime.split(':').map(Number);

      // Convert to 24-hour format
      if (fromPeriod === 'PM' && fromHour !== 12) fromHour += 12;
      if (fromPeriod === 'AM' && fromHour === 12) fromHour = 0;
      if (toPeriod === 'PM' && toHour !== 12) toHour += 12;
      if (toPeriod === 'AM' && toHour === 12) toHour = 0;

      return (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute);
    };

    return selectedValues.timeFrom && selectedValues.timeTo ?
      getMinutesBetween(selectedValues.timeFrom, selectedValues.timeTo) : 0;
  };

  const handleOverride = async () => {
    try {
      const durationCheck = checkScheduleDuration(conflicts);
      if (durationCheck.shortDurations > 0) {
        const result = await Swal.fire({
          title: 'Warning: Short Duration Schedules',
          html: `
            <div class="text-left">
              <p class="mb-2">The following schedules have less than 2 hours duration:</p>
              <ul class="list-disc pl-5">
                ${durationCheck.affectedSchedules.map(schedule =>
            `<li>${schedule.type}: ${schedule.details}</li>`
          ).join('')}
              </ul>
              <p class="mt-2 text-red-600">Are you sure you want to proceed?</p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#1a237e',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Override',
          cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
          return;
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
        userId: user._id,
        force: true,
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
        title: 'Success!',
        text: `Schedule has been ${editMode ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        timer: 1500
      });

      onClose();
      clearForm();
      onScheduleCreated();
    } catch (error) {
      console.error('Error in override:', error);
      await Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error'
      });
    }
  };

  const [conflicts, setConflicts] = useState(null);

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
    setConflicts(null);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        clearForm();
        onClose();
      }}>
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
                <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-5">
                  {editMode ? 'Edit Schedule' : 'New Schedule Entry'}
                </Dialog.Title>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  {loading ? (
                    <ScheduleModalSkeleton />
                  ) : (
                    <>
                      <div className="bg-[#1a237e] p-4 rounded-lg mb-6">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1 text-white">
                            <div className="flex gap-2">
                              <span className="font-medium">Academic Year:</span>
                              <span>{termInfo?.academicYear || schoolYear}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium">Term:</span>
                              <span className="term-display">{termInfo?.term || 'Loading...'}</span>
                            </div>
                          </div>
                          {selectedValues.faculty && (
                            <div className="space-y-2 text-white">
                              <div className="flex flex-col gap-2">
                                <hr />
                                <div className="flex gap-2">
                                  <span className="text-lg font-bold">Selected Faculty Load Information</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1 pl-4">
                                  <li>
                                    <span className="font-medium">Employment Type:</span>
                                    <span className="ml-2">{getFacultyLoadDisplay().employmentType}</span>
                                  </li>
                                  <li>
                                    <span className="font-medium">Total Teaching Hours:</span>
                                    <span className="ml-2">
                                      {getFacultyLoadDisplay().subjectCount} subject(s), {getFacultyLoadDisplay().teachingHours} hrs
                                      {getFacultyLoadDisplay().subjectCodes.length > 0 && (
                                        <span className="ml-2">[{getFacultyLoadDisplay().subjectCodes.join(', ')}]</span>
                                      )}
                                    </span>
                                  </li>
                                  {getFacultyLoadDisplay().employmentType.toLowerCase() === 'full-time' && (
                                    <li>
                                      <span className="font-medium">Total Admin Hours:</span>
                                      <span className="ml-2">{getFacultyLoadDisplay().adminHours} hrs</span>
                                    </li>
                                  )}
                                  <li>
                                    <span className="font-medium">Maximum Load:</span>
                                    <span className="ml-2">{getFacultyLoadDisplay().totalHours} hrs</span>
                                  </li>
                                </ul>
                              </div>
                            </div>

                          )}
                        </div>
                      </div>

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

                      {conflicts && (
                        <ConflictAlert
                          conflicts={conflicts}
                          onDismiss={() => setConflicts(null)}
                          onOverride={handleOverride}
                          overrideEnabled={overrideEnabled}
                          setOverrideEnabled={setOverrideEnabled}
                          hasShortDuration={!checkScheduleDuration(conflicts).isValid}
                          currentScheduleDuration={getCurrentScheduleDuration()}
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">Section</label>
                            <Select
                              name="section"
                              value={selectedValues.isMultipleSections
                                ? sectionOptions.filter(option => selectedValues.section?.includes(option.value))
                                : sectionOptions.find(option => option.value === selectedValues.section)
                              }
                              onChange={(option) => handleSelectChange(option, { name: 'section' })}
                              options={sectionOptions}
                              styles={customStyles}
                              className="text-black"
                              placeholder="Select a Section"
                              isClearable
                              isMulti={selectedValues.isMultipleSections}
                              isSearchable={true}
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
                              className="text-black "
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
                              className="w-full rounded-md border border-gray-300 p-2 text-black bg-white focus:border-[#323E8F] focus:ring-[#323E8F] shadow-sm"
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
                              menuPlacement="top"
                              maxMenuHeight={200}
                            />
                          </div>
                        </div>

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
                              menuPlacement="top"
                              maxMenuHeight={200}
                              isSearchable={true}
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
                              menuPlacement="top"
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
                                  className="text-black "
                                  placeholder="Select Schedule Type"
                                  isClearable
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

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
                    className="rounded-md bg-[#1a237e] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#323E8F] focus:ring-offset-2"
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
