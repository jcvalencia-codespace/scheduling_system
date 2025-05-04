"use client"

import { useState, useEffect, useRef } from "react"
// Replace the date-fns import with moment
import moment from 'moment'        // Add this line
import { useLoading } from "../../context/LoadingContext"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import NewScheduleModal from "./_components/NewScheduleModal"
import ViewScheduleModal from "./_components/ViewScheduleModal"
import PreviewPDFModal from "./_components/PreviewPDFModal"
import { getActiveTerm, getAllSections } from './_actions';
import { getSchedules } from './_actions';
import useAuthStore from '@/store/useAuthStore';

import { ScheduleSkeleton, CalendarSkeleton } from './_components/Skeleton';

import Swal from 'sweetalert2';
import {
  PlusIcon,
  PrinterIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function SchedulePage() {
  const { user } = useAuthStore();
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
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [availableSections, setAvailableSections] = useState([]); // Add new state for sections list

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
    fetchActiveTerm();
    fetchSchedules();
    fetchAllSections(); // Add this new function call
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await getSchedules();
      if (response.error) {
        throw new Error(response.error);
      }
      setSchedules(response.schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Convert schedules to FullCalendar events format
    const events = convertSchedulesToEvents(schedules)
    setCalendarEvents(events)
  }, [schedules, selectedSection])

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

  const fetchAllSections = async () => {
    try {
      const response = await getAllSections(); // We'll create this action
      if (response.error) {
        throw new Error(response.error);
      }
      setAvailableSections(response.sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  // Replace the formatDate function
  const formatDate = (dateStr) => {
    return moment(dateStr).format('MMMM D, YYYY')
  }

  // Update the convertSchedulesToEvents function to handle section filtering
  const convertSchedulesToEvents = (schedules) => {
    if (!selectedSection || !activeTerm) return [];

    // Filter schedules for selected section only
    // Remove the term filter since it's already handled by the backend
    const filteredSchedules = schedules.filter((schedule) =>
      schedule.section?.sectionName === selectedSection
    );

    console.log('Filtered schedules:', filteredSchedules.length); // Debug log
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
          const dateStr = thisWeek.format('YYYY-MM-DD')

          // Parse time strings using moment
          const parseTimeStr = (timeStr) => {
            return moment(timeStr, 'h:mm A').format('HH:mm:ss')
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
                scheduleType: slot.scheduleType
              },
            },
            backgroundColor: "#4285F4",
            borderColor: "#3b7ddb",
          }
        })
      })
    })
  }

  // Replace the getUniqueSections function with a simpler one that uses availableSections
  const getUniqueSections = () => {
    return availableSections.map(section => section.sectionName).sort();
  };

  const handleEventClick = (info) => {
    setSelectedSchedule(info.event.extendedProps.schedule)
    setIsViewScheduleModalOpen(true)
  }
  const handlePrintClick = () => {
    if (!selectedSection) {
      Swal.fire({
        icon: 'warning',
        title: 'No Section Selected',
        text: 'Please select a section before printing the schedule.',
        confirmButtonColor: '#323E8F'
      });
      return;
    }
    setIsPDFPreviewOpen(true);
  };
  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      {/* Add FullCalendar styles directly in the component */}
      <style jsx global>{`
        /* Make the calendar fill its container */
        .fullcalendar-container .fc {
          height: 100%;
        }

        /* Style the time slots */
        .fc-timegrid-slot {
          height: 1.35rem !important;  /* Reduced from 4rem to 2.5rem */
        }

        /* Style the events */
        .fc-event {
          border-radius: 4px;
          cursor: pointer;
        }

        /* Style the day headers */
        .fc-col-header-cell {
          background-color: #1a237e;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
          color:rgb(255, 255, 255);
        }

        /* Style the time labels */
        .fc-timegrid-axis {
          font-size: 0.75rem;
          color: #111827 !important;
          font-weight: 500;
        }

        /* Make slot time labels black too */
        .fc .fc-timegrid-slot-label {
          color: #111827;
          font-weight: 500;
        }

        /* Style the grid lines */
        .fc-timegrid-slot, .fc-timegrid-cols table {
          border-color: #e5e7eb !important;
        }

    

        /* Style the event content */
        .fc-event-title, .fc-event-time {
          font-size: 0.75rem;
          white-space: normal;
          overflow: hidden;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-2">
          {/* Section Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">View Schedule of Section:</label>
          <div className="relative w-full sm:w-auto min-w-[240px]">

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a Section</option>
              {getUniqueSections().map((sectionName) => (
                <option key={sectionName} value={sectionName}>
                  {sectionName}
                </option>
              ))}
            </select>
          </div>
        </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
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
        </div>


{/* Schedule Title */}
<div className="text-center my-6">
            {isTermLoading ? (
              <ScheduleSkeleton />
            ) : activeTerm ? (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Class Schedules for AY - {activeTerm.academicYear} ({activeTerm.term})</h2>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="fullcalendar-container" style={{ height: "800px" }}>
            {isLoading ? (
              <CalendarSkeleton />
            ) : !selectedSection ? (
              <div className="h-full flex items-center justify-center">
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
                slotMinTime="07:00:00" // Change this from "06:00:00" to "07:00:00"
                slotMaxTime="22:00:00"
                events={calendarEvents}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                height="100%"
                slotDuration="00:20:00"
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  omitZeroMinute: true,
                  meridiem: "short",
                }}
                dayHeaderFormat={{ weekday: "short" }}
                hiddenDays={[0]} // Hides Sunday
              />
            )}
          </div>
        </div>

        {/* Include your actual modal components */}
        <NewScheduleModal
          isOpen={isNewScheduleModalOpen}
          onClose={() => setIsNewScheduleModalOpen(false)}
          onScheduleCreated={fetchSchedules}
        />

        <ViewScheduleModal
          isOpen={isViewScheduleModalOpen}
          onClose={() => setIsViewScheduleModalOpen(false)}
          schedule={selectedSchedule}
          onScheduleDeleted={fetchSchedules}  // Make sure this line is included
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
      </div>
    </div>
  )
}
function renderEventContent(eventInfo) {
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


