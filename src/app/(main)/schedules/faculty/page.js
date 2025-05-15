"use client"

import { useState, useEffect, useRef } from "react"
import moment from 'moment'
import { useLoading } from "../../../context/LoadingContext"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import ViewScheduleModal from "../_components/ViewScheduleModal"
import { getActiveTerm } from '../_actions'
import { getFacultySchedules, getAllFaculty } from './_actions'
import useAuthStore from '@/store/useAuthStore'
import { ClockIcon, PrinterIcon, PlusIcon } from '@heroicons/react/24/outline'
import AdminHoursModal from '../_components/AdminHoursModal'
import PreviewPDFModal from "../_components/PreviewPDFModal"
import NewScheduleModal from "../_components/NewScheduleModal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AcademicCapIcon, UserGroupIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import FacultySchedulePDF from './_components/FacultySchedulePDF'
import Swal from 'sweetalert2'

import { ScheduleSkeleton, CalendarSkeleton } from '../_components/Skeleton'

// Add this import at the top with other imports
import { getAdminHours } from '../_actions'

const NoSSRSelect = dynamic(() => import('react-select'), {
  ssr: false,
})

// Create a wrapped Select component to handle client-side rendering
const SelectWrapper = ({ value, onChange, options, isDisabled, placeholder, isLoading }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full sm:w-[300px] h-[38px] bg-gray-50 rounded-md border border-gray-200">
        <div className="animate-pulse h-full"></div>
      </div>
    );
  }

  return (
    <NoSSRSelect
      instanceId={`faculty-select-${mounted ? 'mounted' : 'loading'}`}
      value={value}
      onChange={onChange}
      options={options}
      isDisabled={isDisabled}
      isLoading={isLoading}
      className="w-full"
      classNamePrefix="react-select"
      placeholder={placeholder}
      styles={{
        menu: (base) => ({
          ...base,
          zIndex: 9999,
          backgroundColor: 'var(--select-bg, #ffffff)',
          border: '1px solid var(--select-border, #e5e7eb)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.375rem',
          '.dark &': {
            backgroundColor: '#1f2937',
            borderColor: '#374151'
          }
        }),
        control: (base, state) => ({
          ...base,
          backgroundColor: 'var(--select-bg, #ffffff)',
          borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
          boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
          '&:hover': {
            borderColor: '#3b82f6'
          },
          '.dark &': {
            backgroundColor: '#1f2937',
            borderColor: state.isFocused ? '#3b82f6' : '#374151'
          }
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? '#323E8F' 
            : state.isFocused 
              ? 'var(--select-hover, #f3f4f6)' 
              : 'transparent',
          color: state.isSelected ? '#ffffff' : 'var(--select-text, #111827)',
          '.dark &': {
            backgroundColor: state.isSelected 
              ? '#323E8F' 
              : state.isFocused 
                ? '#374151' 
                : 'transparent',
            color: state.isSelected ? '#ffffff' : '#e5e7eb'
          },
          '&:hover': {
            backgroundColor: state.isSelected ? '#323E8F' : 'var(--select-hover, #f3f4f6)'
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
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--select-placeholder, #6b7280)',
          '.dark &': {
            color: '#9ca3af'
          }
        }),
        loadingMessage: (base) => ({
          ...base,
          color: 'var(--select-text, #111827)',
          '.dark &': {
            color: '#e5e7eb'
          }
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: 'var(--select-text, #111827)',
          '.dark &': {
            color: '#e5e7eb'
          }
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: 'var(--select-border, #e5e7eb)',
          '.dark &': {
            backgroundColor: '#374151'
          }
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: 'var(--select-placeholder, #6b7280)',
          '&:hover': {
            color: 'var(--select-text, #111827)'
          },
          '.dark &': {
            color: '#9ca3af',
            '&:hover': {
              color: '#e5e7eb'
            }
          }
        })
      }}
    />
  );
};

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [activeTerm, setActiveTerm] = useState(null)
  const { isLoading, setIsLoading } = useLoading()
  const [schedules, setSchedules] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const calendarRef = useRef(null)
  const [isTermLoading, setIsTermLoading] = useState(true)
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false)
  const [isAdminHoursModalOpen, setIsAdminHoursModalOpen] = useState(false)
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname();
  const [availableFaculty, setAvailableFaculty] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState("")
  // Add this with other state declarations
  const [adminHours, setAdminHours] = useState([]);
  const [isFacultyLoading, setIsFacultyLoading] = useState(true);
  const [filteredFacultyOptions, setFilteredFacultyOptions] = useState([]);
  // Add new state variable after other state declarations
  const [adminHoursDocId, setAdminHoursDocId] = useState(null);

  const formatDate = (dateStr) => {
    return moment(dateStr).format('MMMM D, YYYY')
  }

  useEffect(() => {
    fetchActiveTerm()
    if (user?.role === 'Faculty') {
      fetchFacultySchedules(user._id)
      setSelectedFaculty(user._id)
    } else {
      fetchAllFaculty()
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100
      setIsScrolled(scrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fetchActiveTerm = async () => {
    setIsTermLoading(true);
    try {
      const response = await getActiveTerm();
      if (response.error) {
        throw new Error(response.error);
      }
      setActiveTerm(response.term);
    } catch (error) {
      console.error('Error fetching active term:', error);
    } finally {
      setIsTermLoading(false);
    }
  };

  const fetchFacultySchedules = async (facultyId) => {
    setIsLoading(true);
    try {
      const [scheduleResponse, adminHoursResponse] = await Promise.all([
        getFacultySchedules(facultyId),
        getAdminHours(facultyId, activeTerm?.id)
      ]);

      if (scheduleResponse.error) {
        throw new Error(scheduleResponse.error);
      }

      const regularSchedules = scheduleResponse.schedules || [];
      const adminHours = adminHoursResponse.hours?.slots || [];
      
      // Store the admin hours document ID
      setAdminHoursDocId(adminHoursResponse.hours?._id || null);
      setSchedules(regularSchedules);
      setAdminHours(adminHours);

    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllFaculty = async () => {
    setIsFacultyLoading(true);
    try {
      const departmentId = user?.role === 'Dean' ? user.department : null;
      const response = await getAllFaculty(departmentId, user);

      if (response.error) {
        throw new Error(response.error);
      }

      setAvailableFaculty(response.faculty);
      // Create filtered options after data is received
      const options = response.faculty.map(faculty => ({
        value: faculty._id,
        label: `${faculty.firstName} ${faculty.lastName}`
      }));
      setFilteredFacultyOptions(options);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setFilteredFacultyOptions([]);
    } finally {
      setIsFacultyLoading(false);
    }
  }


  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultySchedules(selectedFaculty)
    } else {
      setSchedules([]) // Clear schedules when no faculty is selected
    }
  }, [selectedFaculty])

  useEffect(() => {
    const events = convertSchedulesToEvents(schedules);
    setCalendarEvents(events);
  }, [schedules, adminHours]); // Add adminHours as dependency


  // Modify the convertSchedulesToEvents function
  const convertSchedulesToEvents = (schedules) => {
    if (!activeTerm) return [];

    let events = [];

    // Convert regular schedules to events
    events = schedules.flatMap((schedule) => {
      const sectionNames = Array.isArray(schedule.section)
        ? schedule.section.map((section) => section.sectionName).join(", ")
        : schedule.section?.sectionName || 'N/A'

      return schedule.scheduleSlots.flatMap((slot) => {
        return slot.days.map((day) => {
          const dayMap = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
          }

          const dayNumber = dayMap[day]
          const today = moment()
          const thisWeek = moment(today)
          thisWeek.day(dayNumber)
          const dateStr = thisWeek.format('YYYY-MM-DD')

          const parseTimeStr = (timeStr) => {
            return moment(timeStr, 'h:mm A').format('HH:mm:ss')
          }

          const startTime = parseTimeStr(slot.timeFrom)
          const endTime = parseTimeStr(slot.timeTo)

          return {
            id: `${schedule._id}-${day}`,
            title: `${schedule.subject.subjectCode} - ${slot.room.roomCode}\n${sectionNames}`,
            start: `${dateStr}T${startTime}`,
            end: `${dateStr}T${endTime}`,
            extendedProps: {
              schedule: {
                ...schedule,
                timeFrom: slot.timeFrom,
                timeTo: slot.timeTo,
                days: [day],
                room: slot.room,
                scheduleType: slot.scheduleType
              },
            },
            backgroundColor: "#4285F4",
            borderColor: "#3b7ddb",
          }
        })
      })
    })

    // Convert admin hours to events
    const adminEvents = adminHours
      .filter(slot => slot.status === 'approved') // Only show approved admin hours
      .map(slot => {
        const dayMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const dayNumber = dayMap[slot.day];
        const today = moment();
        const thisWeek = moment(today);
        thisWeek.day(dayNumber);
        const dateStr = thisWeek.format('YYYY-MM-DD');

        return {
          id: `admin-${slot._id}`,
          title: `Admin Hours\n${slot.startTime} - ${slot.endTime}`,
          start: `${dateStr}T${moment(slot.startTime, 'h:mm A').format('HH:mm:ss')}`,
          end: `${dateStr}T${moment(slot.endTime, 'h:mm A').format('HH:mm:ss')}`,
          backgroundColor: "#579980", // Different color for admin hours
          borderColor: "#488b73",
          extendedProps: {
            isAdminHours: true,
            adminHours: {
              ...slot,
              _id: slot._id,
              parentId: adminHoursDocId, // Use the stored document ID
              isAdminHours: true,
              term: activeTerm,
              status: slot.status
            }
          }
        };
      });

    return [...events, ...adminEvents];
  };

  const handleEventClick = (info) => {
    if (info.event.extendedProps.isAdminHours) {
      // Format admin hours data to match schedule structure
      const adminHoursData = {
        ...info.event.extendedProps.adminHours,
        isAdminHours: true,
        timeFrom: info.event.extendedProps.adminHours.startTime,
        timeTo: info.event.extendedProps.adminHours.endTime,
        term: activeTerm,
        faculty: availableFaculty.find(f => f._id === selectedFaculty)
      };
      setSelectedSchedule(adminHoursData);
      setIsViewScheduleModalOpen(true);
      return;
    }

    // Existing logic for regular schedules
    setSelectedSchedule(info.event.extendedProps.schedule);
    setIsViewScheduleModalOpen(true);
  };

  const handlePrintClick = () => {
    if (!selectedFaculty) {
      Swal.fire({
        icon: "warning",
        title: "No Faculty Selected",
        text: "Please select a faculty member to view their schedule.",
        confirmButtonColor: "#323E8F",
      });
      return;
    }
    setIsPDFPreviewOpen(true);
  };

  const canCreateSchedule = user?.role === "Dean" || user?.role === "Administrator" || user?.role === "Program Chair"
  const canSeeTabNav = user?.role !== "Faculty"

  const facultyOptions = user?.role === 'Faculty'
    ? [{ value: user._id, label: `${user.firstName} ${user.lastName}` }]
    : filteredFacultyOptions

  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <style jsx global>{`
        body {
          background-color: var(--bg-color, #f8fafc);
        }

        .bg-gradient-to-b {
          background-image: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          position: relative;
        }

        .dark body {
          background-color: #111827;
        }

        .dark .bg-gradient-to-b {
          background-image: linear-gradient(to bottom, #111827, #1f2937);
        }

        .dark .bg-white {
          background-color: #1f2937;
        }

        .dark .text-gray-800 {
          color: #f3f4f6;
        }

        .dark .text-gray-600 {
          color: #d1d5db;
        }

        .dark .text-gray-500 {
          color: #9ca3af;
        }

        .dark .border-gray-100 {
          border-color: #374151;
        }

        .dark .shadow-md {
          --tw-shadow-color: rgba(0, 0, 0, 0.3);
        }

        /* Calendar Styles */
        .dark .fc-col-header-cell {
          background-color: #1e3a8a;
          color: #f3f4f6;
        }

        .dark .fc-timegrid-axis,
        .dark .fc-timegrid-slot-label {
          color: #e5e7eb !important;
        }

        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: #374151 !important;
        }

        .dark .fc-theme-standard .fc-scrollgrid {
          border-color: #374151;
        }

        .dark .fc-timegrid-event {
          background-color: #3b82f6;
          border-color: #2563eb;
        }

        .dark button.bg-white {
          background-color: #1f2937;
          color: #f3f4f6;
          border-color: #374151;
        }

        .dark button.bg-white:hover {
          background-color: #374151;
        }
      `}</style>

      {/* Conditionally render TabNav */}
      {canSeeTabNav && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="mx-auto px-4">
              <div className="flex h-14">
                <div className="flex space-x-8">
                  {[
                    { name: "Class Schedules", href: "/schedules", icon: AcademicCapIcon },
                    { name: "Faculty Schedules", href: "/schedules/faculty", icon: UserGroupIcon },
                    { name: "Room Schedules", href: "/schedules/room", icon: BuildingOffice2Icon },
                  ].map((tab) => (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`
                        group relative inline-flex items-center px-1 pt-3 pb-2.5 text-sm font-medium
                        transition-all duration-200 ease-in-out
                        ${pathname === tab.href ? "text-[#323E8F]" : "text-gray-500 hover:text-gray-700"}
                      `}
                    >
                      <div
                        className={`
                          absolute bottom-0 left-0 h-0.5 w-full transform
                          ${pathname === tab.href ? "bg-[#323E8F]" : "bg-transparent group-hover:bg-gray-300"}
                          transition-all duration-200 ease-in-out
                        `}
                      />
                      <tab.icon
                        className={`
                          h-5 w-5 mr-2 transition-all duration-200
                          ${pathname === tab.href
                            ? "text-[#323E8F] transform scale-110"
                            : "text-gray-400 group-hover:text-gray-500"
                          }
                        `}
                      />
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .fullcalendar-container .fc {
          height: auto !important;
        }

        .fc-timegrid-slot {
          height: 2rem !important;
        }

        .fc .fc-scroller {
          overflow: hidden !important;
        }

        .fc .fc-scroller-liquid-absolute {
          position: relative !important;
        }

        .tooltip {
          position: relative;
          display: inline-block;
        }

        .tooltip .tooltiptext {
          visibility: hidden;
          background-color: #1a237e;
          color: white;
          text-align: center;
          padding: 4px 8px;
          border-radius: 6px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }

        .fc-event {
          border-radius: 4px;
          cursor: pointer;
        }

        .fc-col-header-cell {
          background-color: #1a237e;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: rgb(255, 255, 255);
        }

        .fc-timegrid-axis {
          font-size: 0.75rem;
          color: #111827 !important;
          font-weight: 500;
        }

        .fc .fc-timegrid-slot-label {
          color: #111827;
          font-weight: 500;
        }

        .fc-timegrid-slot, .fc-timegrid-cols table {
          border-color: #e5e7eb !important;
        }

        .fc-event-title, .fc-event-time {
          font-size: 0.75rem;
          white-space: normal;
          overflow: hidden;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-2">
          {/* Faculty Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              View Schedule of:
            </label>
            <div className="w-full sm:w-[300px]">
              <SelectWrapper
                value={facultyOptions.find(option => option.value === selectedFaculty)}
                onChange={(option) => setSelectedFaculty(option?.value)}
                options={isFacultyLoading ? [] : facultyOptions}
                isDisabled={user?.role === 'Faculty' || isFacultyLoading}
                placeholder={isFacultyLoading ? "Loading faculty..." : "Select a Faculty"}
                isLoading={isFacultyLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`
            flex gap-2 sm:gap-3 transition-all duration-300 ease-in-out w-full sm:w-auto
            justify-end sm:justify-start mt-4 sm:mt-0
            ${isScrolled ? 'opacity-0 transform translate-y-[-20px]' : 'opacity-100 transform translate-y-0'}
          `}>
            {user?.employmentType !== 'part-time' && (
              <button
                onClick={() => setIsAdminHoursModalOpen(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-[#579980] hover:bg-[#488b73] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#77DD77]"
              >
                <ClockIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Set Admin Hours</span>
                <span className="sm:hidden">Admin Hours</span>
              </button>
            )}
            {canCreateSchedule && (
              <button
                onClick={() => setIsNewScheduleModalOpen(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#283275] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
              >
                <PlusIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Schedule</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
            <button
              onClick={handlePrintClick}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PrinterIcon className="h-5 w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Print Schedule</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Fixed buttons on scroll */}
        <div className={`fixed right-8 bottom-8 flex flex-col gap-4 transition-all duration-300 ease-in-out z-[60]
          ${isScrolled ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-[20px] pointer-events-none'}`}>
          {user?.employmentType !== 'part-time' && (
            <div className="tooltip">
              <button
                onClick={() => setIsAdminHoursModalOpen(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#579980] hover:bg-[#488b73] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#77DD77] shadow-lg transition-all duration-200"
              >
                <ClockIcon className="h-6 w-6" />
              </button>
              <span className="tooltiptext">Set Admin Hours</span>
            </div>
          )}

          {canCreateSchedule && (
            <div className="tooltip">
              <button
                onClick={() => setIsNewScheduleModalOpen(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#323E8F] hover:bg-[#283275] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F] shadow-lg transition-all duration-200"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
              <span className="tooltiptext">New Schedule</span>
            </div>
          )}

          <div className="tooltip">
            <button
              onClick={handlePrintClick}
              className="w-12 h-12 rounded-full flex items-center justify-center text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F] shadow-lg transition-all duration-200"
            >
              <PrinterIcon className="h-6 w-6" />
            </button>
            <span className="tooltiptext">Print Schedule</span>
          </div>
        </div>

        <div className="text-center my-6">
          {isTermLoading ? (
            <ScheduleSkeleton />
          ) : activeTerm ? (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Faculty Schedules AY - {activeTerm.academicYear} ({activeTerm.term})</h2>
              <p className="mt-0.5 text-sm text-gray-800">
                {formatDate(activeTerm.startDate)} - {formatDate(activeTerm.endDate)}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">No Active Term</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please contact the administrator to set an active term.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="fullcalendar-container">
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: "",
                  center: "",
                  right: "",
                }}
                allDaySlot={false}
                slotMinTime="07:00:00"
                slotMaxTime="22:00:00"
                events={calendarEvents}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                height="auto"
                slotDuration="00:20:00"
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  omitZeroMinute: true,
                  meridiem: "short",
                }}
                dayHeaderFormat={{ weekday: "short" }}
                hiddenDays={[0]}
              />
            )}
          </div>
        </div>

        <ViewScheduleModal
          isOpen={isViewScheduleModalOpen}
          onClose={() => {
            setIsViewScheduleModalOpen(false);
            // Refresh schedules after view modal closes (in case of edits)
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
          schedule={selectedSchedule}
          onScheduleDeleted={() => {
            // Refresh schedules after deletion
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
        />

        <AdminHoursModal
          isOpen={isAdminHoursModalOpen}
          onClose={() => {
            setIsAdminHoursModalOpen(false);
            // Add refresh after modal closes
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
          maxHours={40}
          currentUser={user}
          termId={activeTerm?.id}
          onSuccess={() => {
            // Add refresh after successful creation
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
        />

        <PreviewPDFModal
          isOpen={isPDFPreviewOpen}
          onClose={() => setIsPDFPreviewOpen(false)}
          pdfProps={{
            activeTerm,
            schedules: schedules,
            adminHours: adminHours, // Add admin hours to PDF props
            selectedSection: user?.role === 'Faculty'
              ? `${user.firstName} ${user.lastName}`
              : availableFaculty.find(f => f._id === selectedFaculty)
                ? `${availableFaculty.find(f => f._id === selectedFaculty).firstName} ${availableFaculty.find(f => f._id === selectedFaculty).lastName}`
                : '',
            pdfGenerator: FacultySchedulePDF
          }}
        />

        <NewScheduleModal
          isOpen={isNewScheduleModalOpen}
          onClose={() => {
            setIsNewScheduleModalOpen(false);
            // Refresh schedules after modal closes
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
          onScheduleCreated={() => {
            // Refresh schedules after schedule is created/updated
            if (selectedFaculty) {
              fetchFacultySchedules(selectedFaculty);
            }
          }}
          selectedSection={user?.firstName + " " + user?.lastName}
          selectedFaculty={availableFaculty.find(f => f._id === selectedFaculty)}
        />
      </div>
    </div>
  )
}

function renderEventContent(eventInfo) {
  const isAdminHours = eventInfo.event.extendedProps.isAdminHours;

  if (isAdminHours) {
    const adminHours = eventInfo.event.extendedProps.adminHours;
    return (
      <div
        style={{
          fontSize: "0.75rem",
          padding: "0.25rem",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div className="mb-2">{adminHours.startTime} - {adminHours.endTime}</div>
        <div
          style={{ fontWeight: "900", fontSize: "0.85rem" }}
        >
          Admin Hours
        </div>
        <div style={{ fontSize: "0.75rem" }}>
          {adminHours.day}
        </div>
      </div>
    );
  }

  // Existing rendering logic for regular schedules
  const schedule = eventInfo.event.extendedProps.schedule;

  return (
    <div
      style={{
        fontSize: "0.75rem",
        padding: "0.25rem",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div className="mb-2">{schedule.timeFrom} - {schedule.timeTo}</div>

      <div
        className="mb-1"
        style={{ fontWeight: "700", fontSize: "0.85rem" }}
      >
        {schedule.subject?.subjectCode || 'N/A'}
      </div>

      <div className="mb-1"
        style={{ fontWeight: "400", fontSize: "0.65rem" }}
      >
        {schedule.subject?.subjectName || 'N/A'}
      </div>

      <div
        className="mb-1"
        style={{ fontWeight: "700", fontSize: "0.85rem" }}
      >
        {schedule.section?.sectionName || 'N/A'}
      </div>

      <div className="mb-1"
        style={{ fontWeight: "600", fontSize: "0.75rem" }}
      >
        {schedule.room?.roomCode || 'Room N/A'}
      </div>

      <div style={{ fontWeight: "600", fontSize: "0.75rem" }}>
        {schedule.faculty ? `${schedule.faculty.firstName[0]}.${' ' + schedule.faculty.lastName}` : 'TBA (To Be Assigned)'}
      </div>
    </div>
  );
}

