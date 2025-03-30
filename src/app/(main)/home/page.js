"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { useLoading } from "../../context/LoadingContext"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import NewScheduleModal from "./_components/NewScheduleModal"
import ViewScheduleModal from "./_components/ViewScheduleModal"
import PreviewPDFModal from "./_components/PreviewPDFModal"
import { getActiveTerm } from './_actions';
import { getSchedules } from './_actions';
import useAuthStore from '@/store/useAuthStore';
import {
  PlusIcon,
  PrinterIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
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

  const ScheduleSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const CalendarSkeleton = () => (
    <div className="animate-pulse bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-6 gap-4 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded"></div>
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="w-20 h-16 bg-gray-200 rounded"></div>
          {[...Array(6)].map((_, j) => (
            <div key={j} className="flex-1 h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    fetchActiveTerm();
    fetchSchedules();
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

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), "MMMM d, yyyy")
  }

  // Convert our schedule data to FullCalendar event format
  const convertSchedulesToEvents = (schedules) => {
    if (!selectedSection) return [];
    
    const filteredSchedules = schedules.filter((schedule) => 
      schedule.section?.sectionName === selectedSection
    );

    // Map each schedule to FullCalendar events
    return filteredSchedules.flatMap((schedule) => {
      // Create events for each slot in scheduleSlots
      return schedule.scheduleSlots.flatMap((slot) => {
        return slot.days.map((day) => {
          // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
          const dayMap = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
          }

          // Get the day number
          const dayNumber = dayMap[day]

          // Create a date for this week's occurrence of the day
          const today = new Date()
          const thisWeek = new Date(today)
          thisWeek.setDate(today.getDate() - today.getDay() + dayNumber)

          // Format the date as YYYY-MM-DD
          const dateStr = thisWeek.toISOString().split("T")[0]

          // Parse time strings (e.g., "7:00 AM" to "07:00:00")
          const parseTimeStr = (timeStr) => {
            const [time, period] = timeStr.toLowerCase().split(" ")
            let [hours, minutes] = time.split(":").map(Number)

            // Convert to 24-hour format
            if (period === "pm" && hours !== 12) {
              hours += 12
            } else if (period === "am" && hours === 12) {
              hours = 0
            }

            // Format as HH:MM:SS
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
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

  const handleEventClick = (info) => {
    setSelectedSchedule(info.event.extendedProps.schedule)
    setIsViewScheduleModalOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-gray-100">
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
          background-color: #f9fafb;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #6b7280;
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

        /* Highlight today's column */
        .fc-day-today {
          background-color: rgba(239, 246, 255, 0.5) !important;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 pt-12">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Class Schedule</h1>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
               <PlusIcon className="h-5 w-5 mr-2" />
              New Schedule
            </button>
            <button
              onClick={() => setIsPDFPreviewOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#323E8F]"
            >
             <PrinterIcon className="h-5 w-5 mr-2" />
             Print Schedule
            </button>
          </div>
        </div>

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
              {schedules
                .map(schedule => schedule.section?.sectionName)
                .filter((value, index, self) => value && self.indexOf(value) === index)
                .map((sectionName) => (
                  <option key={sectionName} value={sectionName}>
                    {sectionName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Schedule Title */}
        <div className="text-center my-6">
          {isTermLoading ? (
            <ScheduleSkeleton />
          ) : activeTerm ? (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Schedule for {activeTerm.term}</h2>
              <p className="mt-1 text-sm text-gray-600">SY - {activeTerm.academicYear}</p>
              <p className="mt-0.5 text-sm text-gray-500">
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
      <div className="mb-4">{schedule.timeFrom} - {schedule.timeTo}</div>

      <div
        className="mb-1"
        style={{ fontWeight: "600" }}
      >
        {schedule.subject?.subjectCode || 'N/A'}
      </div>

      <div className="mb-1">
        {schedule.subject?.subjectName || 'N/A'}
      </div>

      <div className="mb-1">
        {schedule.room?.roomCode || 'Room N/A'}
      </div>

      <div>
        {`${schedule.faculty?.lastName || ''}, ${schedule.faculty?.firstName || ''}`}
      </div>
    </div>
  );
}


const handleDeleteSchedule = async (scheduleId) => {
  if (!user || !user._id) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'You must be logged in to perform this action',
      confirmButtonColor: '#323E8F'
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#323E8F',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      const response = await deleteSchedule(scheduleId, user._id);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchSchedules(); // Refresh the schedules
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Schedule has been deleted.',
        confirmButtonColor: '#323E8F'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete schedule',
        confirmButtonColor: '#323E8F'
      });
    }
  }
};
