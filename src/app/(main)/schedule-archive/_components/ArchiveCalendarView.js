'use client'
import { useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

export default function ArchiveCalendarView({ events }) {
  const calendarRef = useRef(null)

  const renderEventContent = (eventInfo) => {
    if (!eventInfo?.event?.extendedProps?.schedule) {
      return <div className="p-1 text-xs">Invalid Event</div>;
    }

    const schedule = eventInfo.event.extendedProps.schedule;
    const days = Array.isArray(schedule.days) ? schedule.days : [];
    const room = schedule.room || {};

    return (
      <div className="p-1 text-xs h-full overflow-hidden text-white font-medium">
        <div className="mb-1 font-semibold brightness-110">{schedule.timeFrom} - {schedule.timeTo}</div>
        <div className="font-bold text-sm">{schedule.subject?.subjectCode}</div>
        <div className="text-[10px] mb-1 brightness-95">{schedule.subject?.subjectName}</div>
        <div className="font-semibold opacity-95">{schedule.room?.roomCode}</div>
        <div className="font-semibold opacity-95">
          {schedule.faculty?.firstName 
            ? `${schedule.faculty.firstName[0]}.${" " + schedule.faculty.lastName}`
            : "TBA"}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "",
          center: "",
          right: "",
        }}
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        events={events}
        eventContent={renderEventContent}
        eventClassNames="hover:brightness-90 transition-all shadow-sm"
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
      <style jsx global>{`
        .fc-timegrid-slot {
          height: 2rem !important;
        }
        .fc .fc-scroller {
          overflow: hidden !important;
        }
        .fc-event {
          border-radius: 4px;
          cursor: pointer;
        }
        .fc-col-header-cell {
          background-color: #1a237e;
          color: white;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .fc-timegrid-axis, .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #555555;
          font-weight: 500;
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: #e5e7eb;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        .fc-timegrid-slot-label {
          color: #4b5563;
        }
      `}</style>
    </div>
  )
}
