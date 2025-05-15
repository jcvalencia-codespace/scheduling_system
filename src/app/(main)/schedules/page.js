"use client"

import { useState, useEffect, useRef, Suspense } from "react"
// Replace the date-fns import with moment
import moment from "moment" // Add this line
import { useLoading } from "../../context/LoadingContext"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import NewScheduleModal from "./_components/NewScheduleModal"
import ViewScheduleModal from "./_components/ViewScheduleModal"
import PreviewPDFModal from "./_components/PreviewPDFModal"
import AdminHoursModal from "./_components/AdminHoursModal"
import { getActiveTerm, getAllSections } from "./_actions"
import { getSchedules } from "./_actions"
import useAuthStore from "@/store/useAuthStore"

import { ScheduleSkeleton, CalendarSkeleton } from "./_components/Skeleton"

import Swal from "sweetalert2"
import {
  PlusIcon,
  PrinterIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation" // Add useSearchParams
import dynamic from "next/dynamic"

// Create a dynamic import for Select with SSR disabled
const NoSSRSelect = dynamic(() => import("react-select"), {
  ssr: false,
})

// Create a client component for handling the search params
function SearchParamsHandler({ onSectionChange }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const sectionParam = searchParams.get('section')
    if (sectionParam) {
      onSectionChange(sectionParam)
    }
  }, [searchParams, onSectionChange])

  return null
}

// Main content component
function ScheduleContent() {
  const { user } = useAuthStore()
  const [selectedSection, setSelectedSection] = useState("")
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false)
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [activeTerm, setActiveTerm] = useState(null)
  const { isLoading, setIsLoading } = useLoading()
  const [schedules, setSchedules] = useState([])
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState([])
  const calendarRef = useRef(null)
  const [isTermLoading, setIsTermLoading] = useState(true)
  const [availableSections, setAvailableSections] = useState([]) // Add new state for sections list
  const [isAdminHoursModalOpen, setIsAdminHoursModalOpen] = useState(false)
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  // Generate time slots from 6am to 9pm with hourly intervals
  // Keep this for compatibility with existing components like PDF preview
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7
    const hour12 = hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? "pm" : "am"
    return `${hour12}:00 ${ampm}`
  })

  // Define weekDays for compatibility with existing components
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  useEffect(() => {
    fetchActiveTerm()
    fetchSchedules()
    fetchAllSections()
  }, []) // Remove searchParams dependency

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100
      setIsScrolled(scrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fetchSchedules = async () => {
    setIsLoading(true)
    try {
      const response = await getSchedules()
      if (response.error) {
        throw new Error(response.error)
      }
      setSchedules(response.schedules)
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Convert schedules to FullCalendar events format
    const events = convertSchedulesToEvents(schedules)
    setCalendarEvents(events)
  }, [schedules, selectedSection])

  const fetchActiveTerm = async () => {
    setIsTermLoading(true)
    try {
      const response = await getActiveTerm()
      if (response.error) {
        throw new Error(response.error)
      }
      setActiveTerm(response.term)
    } catch (error) {
      console.error("Error fetching active term:", error)
    } finally {
      setIsTermLoading(false)
    }
  }

  const fetchAllSections = async () => {
    try {
      const response = await getAllSections() // We'll create this action
      if (response.error) {
        throw new Error(response.error)
      }
      setAvailableSections(response.sections)
    } catch (error) {
      console.error("Error fetching sections:", error)
    }
  }

  // Replace the formatDate function
  const formatDate = (dateStr) => {
    return moment(dateStr).format("MMMM D, YYYY")
  }

  // Update the convertSchedulesToEvents function to handle section filtering
  const convertSchedulesToEvents = (schedules) => {
    if (!selectedSection || !activeTerm) return []

    // Filter schedules for selected section only
    // Remove the term filter since it's already handled by the backend
    const filteredSchedules = schedules.filter((schedule) => schedule.section?.sectionName === selectedSection)

    console.log("Filtered schedules:", filteredSchedules.length) // Debug log
    return filteredSchedules.flatMap((schedule) => {
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

          // Replace date manipulation with moment
          const today = moment()
          const thisWeek = moment(today)
          thisWeek.day(dayNumber) // Set to the target day of this week

          // Format the date
          const dateStr = thisWeek.format("YYYY-MM-DD")

          // Parse time strings using moment
          const parseTimeStr = (timeStr) => {
            return moment(timeStr, "h:mm A").format("HH:mm:ss")
          }

          const startTime = parseTimeStr(slot.timeFrom)
          const endTime = parseTimeStr(slot.timeTo)

          return {
            id: `${schedule._id}-${day}`,
            title: `${schedule.subject.subjectCode} - ${slot.room.roomCode}`,
            start: `${dateStr}T${startTime}`,
            end: `${dateStr}T${endTime}`,
            extendedProps: {
              schedule: {
                ...schedule,
                timeFrom: slot.timeFrom,
                timeTo: slot.timeTo,
                days: [day],
                room: slot.room,
                scheduleType: slot.scheduleType,
              },
            },
            backgroundColor: "#4285F4",
            borderColor: "#3b7ddb",
          }
        })
      })
    })
  }

  // Update the getUniqueSections function
  const getUniqueSections = () => {
    if (!availableSections || !user?.role) return [];

    try {
      let filteredSections = [];

      switch (user.role) {
        case "Dean":
          // Get user's department ID, handle both object and string formats
          const userDeptId = user.department?._id?.toString() || user.department?.toString();
          
          // Filter sections by department
          filteredSections = availableSections.filter(section => {
            const sectionDeptId = section.department?._id?.toString() || section.course?.department?._id?.toString();
            return sectionDeptId === userDeptId;
          });
          
          console.log('Dean Filtering:', {
            userDepartmentId: userDeptId,
            availableSections: availableSections.map(s => ({
              sectionName: s.sectionName,
              departmentId: s.department?._id?.toString(),
              courseDepartmentId: s.course?.department?._id?.toString()
            })),
            filteredCount: filteredSections.length
          });
          break;

        case "Program Chair":
          // Extract the course ID string from the buffer object
          const userCourseId = user.course?._id?.toString() || user.course?.toString();
          
          // Compare with the course._id from the section
          filteredSections = availableSections.filter(
            (section) => section.course?._id?.toString() === userCourseId
          );
          
          console.log('Program Chair Filtering:', {
            userCourseId,
            availableSections: availableSections.map(s => ({
              sectionName: s.sectionName,
              courseId: s.course?._id?.toString(),
              course: s.course
            }))
          });
          break;
        default:
          filteredSections = availableSections;
      }

      return filteredSections
        .map((section) => section.sectionName)
        .filter(Boolean)
        .sort();
    } catch (error) {
      console.error("Error in getUniqueSections:", error);
      return [];
    }
  }

  const sectionOptions = getUniqueSections().map((section) => ({
    value: section,
    label: section,
  }))

  const sectionSelectComponent = (
    <div className="w-[300px]">
      {typeof window !== "undefined" && user?.role && (
        <NoSSRSelect
          instanceId="section-select"
          value={sectionOptions.find((option) => option.value === selectedSection)}
          onChange={(option) => setSelectedSection(option?.value || "")}
          options={sectionOptions}
          className="w-full"
          classNamePrefix="react-select"
          placeholder={
            getUniqueSections().length === 0
              ? `No sections available${
                  user?.role === "Dean"
                    ? " for your department"
                    : user?.role === "Program Chair"
                    ? " for your course"
                    : ""
                }`
              : "Select a Section"
          }
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
      )}
    </div>
  )

  const handleEventClick = (info) => {
    setSelectedSchedule(info.event.extendedProps.schedule)
    setIsViewScheduleModalOpen(true)
  }
  const handlePrintClick = () => {
    if (!selectedSection) {
      Swal.fire({
        icon: "warning",
        title: "No Section Selected",
        text: "Please select a section before printing the schedule.",
        confirmButtonColor: "#323E8F",
      })
      return
    }
    setIsPDFPreviewOpen(true)
  }

  const handleScheduleDeleted = () => {
    fetchSchedules(); // or however you refresh your schedules data
  };

  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <style jsx global>{`
        body {
          background-color: #f8fafc;
        }

        /* Simplified gradient background without pattern */
        .bg-gradient-to-b {
          background-image: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          position: relative;
        }

        .bg-gradient-to-b > * {
          position: relative;
          z-index: 1;
        }

        /* Dark mode modification */
        .dark .bg-gradient-to-b {
          background-image: linear-gradient(to bottom, #111827, #1f2937);
        }

        /* Calendar styles */
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

        .fc-timegrid-slot,
        .fc-timegrid-cols table {
          border-color: #e5e7eb !important;
        }

        .fc-event-title,
        .fc-event-time {
          font-size: 0.75rem;
          white-space: normal;
          overflow: hidden;
        }

        /* Tooltip styles */
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

        /* Dark mode styles */
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

        .dark .border-gray-300 {
          border-color: #374151;
        }

        .dark .hover\\:bg-gray-50:hover {
          background-color: #374151;
        }

        .dark .shadow-sm {
          --tw-shadow-color: rgba(0, 0, 0, 0.1);
        }

        .dark button.bg-white {
          background-color: #1f2937;
          color: #f3f4f6;
          border-color: #374151;
        }

        .dark button.bg-white:hover {
          background-color: #374151;
        }

        .dark button.hover\\:bg-gray-50:hover {
          background-color: #374151;
        }

        .dark .print-button {
          --tw-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
        }
      `}</style>

      <Suspense fallback={null}>
        <SearchParamsHandler onSectionChange={setSelectedSection} />
      </Suspense>

      {/* Tab Navigation */}
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
                        ${
                          pathname === tab.href
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

      <div className="space-y-6"></div>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-2">
          {/* Section Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              View Schedule of Section:
            </label>
            {sectionSelectComponent}
          </div>

          {/* Top Buttons */}
          <div
            className={`
            flex gap-2 sm:gap-3 transition-all duration-300 ease-in-out
            ${isScrolled ? "opacity-0 transform translate-y-[-20px]" : "opacity-100 transform translate-y-0"}
          `}
          >
            {/* <button
              onClick={() => setIsAdminHoursModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-[#579980] hover:bg-[#488b73] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#77DD77]"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Set Admin Hours
            </button> */}
            <button
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#283275] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Schedule
            </button>
            <button
              onClick={handlePrintClick}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Schedule
            </button>
          </div>

          {/* Fixed Position Circular Buttons */}
          <div
            className={`
            fixed right-8 bottom-8 flex flex-col gap-4 transition-all duration-300 ease-in-out z-[60]
            ${isScrolled ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-[20px] pointer-events-none"}
          `}
          >
            {/* <div className="tooltip">
              <button
                onClick={() => setIsAdminHoursModalOpen(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#579980] hover:bg-[#488b73] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#77DD77] shadow-lg transition-all duration-200"
              >
                <ClockIcon className="h-6 w-6" />
              </button>
              <span className="tooltiptext">Set Admin Hours</span>
            </div> */}

            <div className="tooltip">
              <button
                onClick={() => setIsNewScheduleModalOpen(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#323E8F] hover:bg-[#283275] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F] shadow-lg transition-all duration-200"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
              <span className="tooltiptext">New Schedule</span>
            </div>

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
        </div>

        {/* Schedule Title */}
        <div className="text-center my-6">
          {isTermLoading ? (
            <ScheduleSkeleton />
          ) : activeTerm ? (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Class Schedules for AY - {activeTerm.academicYear} ({activeTerm.term})
              </h2>
              <p className="mt-0.5 text-sm text-gray-800">
                {formatDate(activeTerm.startDate)} - {formatDate(activeTerm.endDate)}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">No Active Term</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please set an active term in the Term Management page to view schedules.
              </p>
            </div>
          )}
        </div>

        {/* FullCalendar Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="fullcalendar-container">
            {isLoading ? (
              <CalendarSkeleton />
            ) : !selectedSection ? (
              <div className="h-full flex items-center justify-center p-20">
                <div className="text-center">
                  <p className="text-gray-600 text-lg mb-2">Please select a section to view its schedule</p>
                  <p className="text-gray-500 text-sm">The calendar will display once a section is selected</p>
                </div>
              </div>
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

        {/* Include your actual modal components */}
        <NewScheduleModal
          isOpen={isNewScheduleModalOpen}
          onClose={() => setIsNewScheduleModalOpen(false)}
          onScheduleCreated={fetchSchedules}
          selectedSection={selectedSection} // Add this line
        />

        <ViewScheduleModal
          isOpen={isViewScheduleModalOpen}
          onClose={() => setIsViewScheduleModalOpen(false)}
          schedule={selectedSchedule}
          onScheduleDeleted={handleScheduleDeleted}
          onScheduleUpdated={handleScheduleDeleted} // Use the same handler for both cases
        />

        <PreviewPDFModal
          isOpen={isPDFPreviewOpen}
          onClose={() => setIsPDFPreviewOpen(false)}
          pdfProps={{
            activeTerm,
            schedules,
            selectedSection,
          }}
        />

        <AdminHoursModal
          isOpen={isAdminHoursModalOpen}
          onClose={() => setIsAdminHoursModalOpen(false)}
          maxHours={40}
          currentUser={user}
          termId={activeTerm?.id} // Change _id to id to match the model's return format
        />
      </div>
    </div>
  )
}

// Main component
export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScheduleContent />
    </Suspense>
  )
}

// Keep the renderEventContent function as is
function renderEventContent(eventInfo) {
  const schedule = eventInfo.event.extendedProps.schedule

  return (
    <div
      style={{
        fontSize: "0.75rem",
        padding: "0.25rem",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div className="mb-2">
        {schedule.timeFrom} - {schedule.timeTo}
      </div>

      <div className="mb-1" style={{ fontWeight: "700", fontSize: "0.85rem" }}>
        {schedule.subject?.subjectCode || "N/A"}
      </div>

      <div className="mb-1" style={{ fontWeight: "400", fontSize: "0.65rem" }}>
        {schedule.subject?.subjectName || "N/A"}
      </div>

      <div className="mb-1" style={{ fontWeight: "600", fontSize: "0.75rem" }}>
        {schedule.room?.roomCode || "Room N/A"}
      </div>

      <div style={{ fontWeight: "600", fontSize: "0.75rem" }}></div>
      {schedule.faculty
        ? `${schedule.faculty.firstName[0]}.${" " + schedule.faculty.lastName}`
        : "TBA (To Be Assigned)"}
    </div>
  )
}
