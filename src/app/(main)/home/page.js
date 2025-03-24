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

export default function HomePage() {
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
    setIsLoading(true);
    try {
      const response = await getActiveTerm();
      if (response.error) {
        throw new Error(response.error);
      }
      setActiveTerm(response.term);
    } catch (error) {
      console.error('Error fetching active term:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), "MMMM d, yyyy")
  }

  // Convert our schedule data to FullCalendar event format
  const convertSchedulesToEvents = (schedules) => {
    // Filter schedules by selected section if needed
    const filteredSchedules = selectedSection
      ? schedules.filter((schedule) => schedule.sectionName === selectedSection)
      : schedules

    // Map each schedule to a FullCalendar event
    return filteredSchedules.flatMap((schedule) => {
      // Create an event for each day in the schedule
      return schedule.days.map((day) => {
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

        // Parse time strings (e.g., "7:00 am" to "07:00:00")
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

        const startTime = parseTimeStr(schedule.timeFrom)
        const endTime = parseTimeStr(schedule.timeTo)

        return {
          id: `${schedule.id}-${day}`,
          title: `${schedule.subjectCode} - ${schedule.room.roomCode}`,
          start: `${dateStr}T${startTime}`,
          end: `${dateStr}T${endTime}`,
          extendedProps: {
            schedule: schedule,
          },
          backgroundColor: "#4285F4",
          borderColor: "#3b7ddb",
        }
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
          height: 4rem !important;
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
          color: #6b7280;
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
              className="flex-1 sm:flex-initial flex items-center justify-center rounded-md bg-[#4285F4] px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none"
            >
              + New Entry
            </button>
            <button
              onClick={() => setIsPDFPreviewOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center rounded-md bg-[#4A5568] px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
            >
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
              <option value="">All Sections</option>
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
          {activeTerm ? (
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
              slotDuration="01:00:00"
              slotLabelFormat={{
                hour: "numeric",
                minute: "2-digit",
                omitZeroMinute: true,
                meridiem: "short",
              }}
              dayHeaderFormat={{ weekday: "short" }}
              hiddenDays={[0]} // Hides Sunday
            />

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
        />

        <PreviewPDFModal
          isOpen={isPDFPreviewOpen}
          onClose={() => setIsPDFPreviewOpen(false)}
          pdfProps={{
            activeTerm,
            schedules,
            timeSlots,
            weekDays,
            selectedSection,
          }}
        />
      </div>
    </div>
  )
}

// Custom event rendering for FullCalendar
// Update the renderEventContent function
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

