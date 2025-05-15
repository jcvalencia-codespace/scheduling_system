'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getScheduleFormData, createSchedule, getActiveTerm, updateSchedule, getFacultyLoad } from '../_actions';
import Swal from 'sweetalert2';
import Select from 'react-select';
import useAuthStore from '@/store/useAuthStore';
import ScheduleModalSkeleton from './Skeleton';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ConflictAlert from './ConflictAlert';
import { useAccessSettings } from '@/app/hooks/useAccessSettings';
import ScheduleModalSidebar from './ScheduleModalSidebar';

export default function NewScheduleModal({
  isOpen,
  onClose,
  onScheduleCreated,
  editMode = false,
  scheduleData = null,
  selectedSection = '',
  selectedRoom = null,
  selectedFaculty = null
}) {
  const { user } = useAuthStore();
  const { isMultipleSectionsEnabled, isFacultyDropdownEnabled } = useAccessSettings();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      backgroundColor: 'var(--select-bg, #ffffff)',
      borderColor: state.isFocused ? '#323E8F' : '#E5E7EB',
      borderRadius: '0.375rem',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        borderColor: '#323E8F'
      },
      '&:focus': {
        borderColor: '#323E8F',
        boxShadow: '0 0 0 1px #323E8F'
      },
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: state.isFocused ? '#3b82f6' : '#374151',
        color: '#e5e7eb'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6B7280',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#323E8F' 
        : state.isFocused 
          ? 'var(--select-hover, #f3f4f6)' 
          : 'transparent',
      color: state.isSelected 
        ? '#ffffff' 
        : 'var(--select-text, #111827)',
      cursor: 'pointer',
      padding: '8px 12px',
      '.dark &': {
        backgroundColor: state.isSelected 
          ? '#323E8F' 
          : state.isFocused 
            ? '#374151' 
            : 'transparent',
        color: state.isSelected 
          ? '#ffffff' 
          : '#e5e7eb'
      }
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
      },
      '.dark &': {
        backgroundColor: '#1f2937',
        borderColor: '#374151'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'var(--select-text, #111827)',
      '.dark &': {
        color: '#e5e7eb'
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
        setIsLoadingFaculty(true);
        try {
          const loadData = await getFacultyLoad(selectedValues.faculty, termInfo._id);
          setFacultyLoad(loadData);
        } catch (error) {
          console.error('Error loading faculty data:', error);
          setFacultyLoad({
            employmentType: 'N/A',
            totalHours: 0,
            teachingHours: 0,
            adminHours: 0
          });
        } finally {
          setIsLoadingFaculty(false);
        }
      } else {
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
    if (!facultyLoad) return null;

    const employmentType = facultyLoad.employmentType?.toLowerCase();
    const isFullTime = employmentType === 'full-time';
    const maxHours = isFullTime ? 40 : 24;
    const teachingHours = facultyLoad.teachingHours || 0;
    const actualAdminHours = facultyLoad.actualAdminHours || 0;
    const adminHours = isFullTime ? maxHours - teachingHours - actualAdminHours : 0;
    const subjectCodes = facultyLoad.subjectCodes || [];

    return {
      employmentType: capitalizeFirstLetter(facultyLoad.employmentType),
      teachingHours,
      adminHours,
      actualAdminHours,
      totalHours: maxHours,
      subjectCodes,
      subjectCount: subjectCodes.length
    };
  };

  useEffect(() => {
    async function fetchData() {
      if (isOpen) {
        try {
          setLoading(true);
          const [formResponse, termResponse] = await Promise.all([
            getScheduleFormData(),
            getActiveTerm()
          ]);

          // Check if there's an error or no term data
          if (!termResponse || !termResponse.term) {
            throw new Error('No active term found. Please contact an administrator.');
          }

          setFormData(formResponse);
          setTermInfo({
            _id: termResponse.term.id,
            academicYear: termResponse.term.academicYear,
            term: termResponse.term.term
          });
        } catch (error) {
          console.error('Fetch error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to load schedule data',
            confirmButtonColor: '#323E8F'
          });
          onClose(); // Close modal on error
        } finally {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [isOpen]);

  const roomOptions = useMemo(() => {
    if (!formData.rooms.length) return [];

    // Group rooms by department
    const groupedRooms = formData.rooms.reduce((acc, room) => {
      const deptName = room.department?.departmentName || 'Other Rooms';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push({
        value: room._id,
        label: `${room.roomCode} - ${room.roomName || room.name} (${room.capacity} capacity)`
      });
      return acc;
    }, {});

    // Sort rooms within each group
    Object.keys(groupedRooms).forEach(dept => {
      groupedRooms[dept].sort((a, b) => a.label.localeCompare(b.label));
    });

    // Create array of group objects
    let options = Object.entries(groupedRooms).map(([department, rooms]) => ({
      label: department,
      options: rooms
    }));

    // If user is Dean or Program Chair, move their department to the top
    if (user?.department && (user?.role === 'Dean' || user?.role === 'Program Chair')) {
      const userDeptName = formData.rooms.find(
        room => room.department?._id === user.department
      )?.department?.departmentName;

      if (userDeptName) {
        options = [
          ...options.filter(group => group.label === userDeptName),
          ...options.filter(group => group.label !== userDeptName)
        ];
      }
    }

    return options;
  }, [formData.rooms, user]);

  const filteredSectionOptions = useMemo(() => {
    if (!user || !formData.sections) return [];

    let filteredSections = formData.sections;

    // Only filter sections if multiple sections is not enabled
    if (!selectedValues.isMultipleSections) {
      if (user.role === 'Dean') {
        // For Dean, only show sections from their department
        const userDeptId = user.department?._id || user.department;
        filteredSections = formData.sections.filter(section => {
          const sectionDeptId = section.department?._id || section.department;
          return sectionDeptId && sectionDeptId.toString() === userDeptId.toString();
        });
      } else if (user.role === 'Program Chair') {
        // For Program Chair, only show sections from their course
        const userCourseId = user.course?._id || user.course;
        filteredSections = formData.sections.filter(section => {
          const sectionCourseId = section.course?._id || section.course;
          return sectionCourseId && sectionCourseId.toString() === userCourseId.toString();
        });
      }
    }

    console.log('Section filtering:', {
      isMultipleSections: selectedValues.isMultipleSections,
      totalSections: formData.sections.length,
      filteredCount: filteredSections.length
    });

    return filteredSections.map(section => ({
      value: section._id,
      label: section.displayName || section.sectionName,
      courseInfo: section.course,
      yearLevel: section.yearLevel
    }));
  }, [formData.sections, user, selectedValues.isMultipleSections]);

  useEffect(() => {
    if (isOpen) {
      // Set initial values
      if (selectedRoom) {
        setSelectedValues(prev => ({
          ...prev,
          room: selectedRoom._id
        }));
      }
      if (selectedFaculty) {
        setSelectedValues(prev => ({
          ...prev,
          faculty: selectedFaculty._id
        }));
      }
      if (selectedSection && formData.sections.length > 0) {
        const sectionObject = formData.sections.find(
          section => section.sectionName === selectedSection
        );
        if (sectionObject) {
          setSelectedValues(prev => ({
            ...prev,
            section: sectionObject._id
          }));
        }
      }
    }
  }, [isOpen, selectedRoom, selectedFaculty, selectedSection, formData.sections]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const facultyOptions = formData.faculty.map(f => ({
    value: f._id,
    label: f.fullName
  }));

  const subjectOptions = formData.subjects.map(subject => ({
    value: subject._id,
    label: subject.displayName
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

      // Add time validation
      const convertTo24Hour = (time12h) => {
        const [time, period] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);

        if (hours === 12) {
          hours = period === 'PM' ? 12 : 0;
        } else if (period === 'PM') {
          hours += 12;
        }

        return hours * 60 + parseInt(minutes); // Convert to minutes since midnight
      };

      // Validate main schedule times
      const mainTimeFrom = convertTo24Hour(selectedValues.timeFrom);
      const mainTimeTo = convertTo24Hour(selectedValues.timeTo);
     
      // Start time must not be equal to end time
      if (mainTimeFrom === mainTimeTo) {
        throw new Error('Start time and end time cannot be the same.');
      }

      // Start time must be earlier than end time
      if (mainTimeFrom > mainTimeTo) {
        throw new Error('Start time must be earlier than end time.');
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

        // Validate paired schedule times
        const pairedTimeFrom = convertTo24Hour(pairedSchedule.timeFrom);
        const pairedTimeTo = convertTo24Hour(pairedSchedule.timeTo);

        if (pairedTimeFrom >= pairedTimeTo) {
          throw new Error('Paired schedule start time must be earlier than end time');
        }
      }

      const scheduleData = {
        ...selectedValues,
        term: termInfo._id,
        days: [selectedValues.days],
        classLimit: parseInt(selectedValues.classLimit, 10), // Ensure classLimit is number
        studentType: selectedValues.studentType, // Ensure studentType is included
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
        force: true, // Add force flag to override conflicts
        pairedSchedule: selectedValues.isPaired ? {
          ...pairedSchedule,
          timeFrom: formatTimeValue(pairedSchedule.timeFrom),
          timeTo: formatTimeValue(pairedSchedule.timeTo),
          days: [pairedSchedule.days]
        } : null
      };

      // Execute the update/create with force flag
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
      // Call onScheduleCreated with the room ID
      if (selectedRoom?._id) {
        onScheduleCreated(selectedRoom._id);
      }
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

  const handleClose = () => {
    if (!isSubmitting) {
      clearForm();
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
                <div className="absolute right-0 top-0 pr-4 pt-4 block z-50">
                  <button
                    type="button"
                    className="rounded-full bg-white text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1.5 transition-colors shadow-sm"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row h-[calc(90vh-2rem)]">
                  <ScheduleModalSidebar
                    editMode={editMode}
                    termInfo={termInfo}
                    facultyLoadDisplay={selectedValues.faculty ? getFacultyLoadDisplay() : null}
                    schoolYear={schoolYear}
                    isLoadingFaculty={isLoadingFaculty}
                    className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200"
                  />

                  {/* Main content */}
                  <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                      {/* Title */}
                      <div className="pt-2 md:pt-4 mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">
                          Schedule Information
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Fill in the details for the schedule
                        </p>
                      </div>

                      {loading ? (
                        <ScheduleModalSkeleton />
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row gap-3  sm:gap-6 mb-4 sm:mb-6">
                            {isMultipleSectionsEnabled && (
                              <label className="flex items-center gap-2 text-black dark:text-gray-100 text-sm md:text-base">
                                <input
                                  type="checkbox"
                                  name="isMultipleSections"
                                  checked={selectedValues.isMultipleSections}
                                  onChange={handleInputChange}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Multiple Sections</span>
                              </label>
                            )}
                            <label className="flex items-center gap-2 text-black dark:text-gray-100 text-sm md:text-base">
                              <input
                                type="checkbox"
                                name="isPaired"
                                checked={selectedValues.isPaired}
                                onChange={handleInputChange}
                                className="rounded border-gray-300  text-blue-600 focus:ring-blue-500"
                              />
                              <span>Pairing Schedule</span>
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

                          {/* Update grid layout for mobile */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Section</label>
                                <Select
                                  name="section"
                                  value={selectedValues.isMultipleSections
                                    ? filteredSectionOptions.filter(option => selectedValues.section?.includes(option.value))
                                    : filteredSectionOptions.find(option => option.value === selectedValues.section)
                                  }
                                  onChange={(option) => handleSelectChange(option, { name: 'section' })}
                                  options={filteredSectionOptions}
                                  styles={customStyles}
                                  className="text-black"
                                  placeholder={
                                    filteredSectionOptions.length === 0
                                      ? "No sections available for your department"
                                      : "Select a Section"
                                  }
                                  isClearable
                                  isMulti={selectedValues.isMultipleSections}
                                  isSearchable={true}
                                />
                              </div>

                              {isFacultyDropdownEnabled && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Faculty</label>
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
                              )}

                              <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Subject</label>
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
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Class Limit</label>
                                <input
                                  type="number"
                                  name="classLimit"
                                  value={selectedValues.classLimit}
                                  onChange={handleInputChange}
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-[#323E8F] focus:ring-[#323E8F] shadow-sm"
                                  placeholder="Enter class limit"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Student Type</label>
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
                                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Days of Week</label>
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
                                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Time From</label>
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
                                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Time To</label>
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
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Room</label>
                                <Select
                                  name="room"
                                  value={roomOptions.flatMap(group => group.options).find(option => option.value === selectedValues.room)}
                                  onChange={(option) => handleSelectChange(option, { name: 'room' })}
                                  options={roomOptions}
                                  styles={{
                                    ...customStyles,
                                    group: (base) => ({
                                      ...base,
                                      paddingTop: 8,
                                      paddingBottom: 8
                                    }),
                                    groupHeading: (base) => ({
                                      ...base,
                                      color: '#323E8F',
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      textTransform: 'uppercase',
                                      padding: '8px 12px',
                                      backgroundColor: '#f8fafc'
                                    })
                                  }}
                                  className="text-black"
                                  placeholder="Select a Room"
                                  menuPlacement="top"
                                  maxMenuHeight={200}
                                  isSearchable={true}
                                  isClearable
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Schedule Type</label>
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

                          {/* Update paired schedule section for mobile */}
                          {selectedValues.isPaired && (
                            <div className="mt-4 md:mt-6 border-t pt-4 md:pt-6">
                              <h4 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Paired Schedule Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Days of Week</label>
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
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Room</label>
                                    <Select
                                      name="room"
                                      value={roomOptions.flatMap(group => group.options).find(option => option.value === pairedSchedule.room)}
                                      onChange={(option) => handlePairedScheduleChange(option, { name: 'room' })}
                                      options={roomOptions}
                                      styles={{
                                        ...customStyles,
                                        group: (base) => ({
                                          ...base,
                                          paddingTop: 8,
                                          paddingBottom: 8
                                        }),
                                        groupHeading: (base) => ({
                                          ...base,
                                          color: '#323E8F',
                                          fontWeight: 600,
                                          fontSize: '0.875rem',
                                          textTransform: 'uppercase',
                                          padding: '8px 12px',
                                          backgroundColor: '#f8fafc'
                                        })
                                      }}
                                      className="text-black"
                                      placeholder="Select a Room"
                                      isClearable
                                    />
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Time From</label>
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
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Time To</label>
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
                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Schedule Type</label>
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

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 p-4 md:p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 shrink-0">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md bg-white px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                        onClick={handleClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        className="inline-flex justify-center items-center rounded-md bg-[#323E8F] px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] transition-colors disabled:opacity-70"
                        onClick={handleSave}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>{editMode ? 'Update Schedule' : 'Save Schedule'}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
