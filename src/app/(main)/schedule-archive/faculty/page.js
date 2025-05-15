'use client'
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useLoading } from "@/app/context/LoadingContext"
import { getArchivedSchedules, getFacultyArchive, getArchivedTerms } from "../_actions"
import useAuthStore from "@/store/useAuthStore"
import TabNav from "../_components/TabNav"
import moment from "moment"
import ArchiveCalendarView from "../_components/ArchiveCalendarView"
import { Calendar, Clock, User } from "lucide-react"
import { components } from "react-select"
import FacultyArchivePDF from './_components/FacultyArchivePDF'

const NoSSRSelect = dynamic(() => import("react-select"), { ssr: false })

export default function FacultyArchive() {
  const { user } = useAuthStore()
  const [faculty, setFaculty] = useState([])
  const [schedules, setSchedules] = useState([])
  const { isLoading, setIsLoading } = useLoading()
  const [archivedTerms, setArchivedTerms] = useState({})
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [portalTarget, setPortalTarget] = useState(null)

  useEffect(() => {
    if (user?._id) {
      console.log('🔄 Faculty Archive: User loaded, fetching initial data')
      fetchArchivedTerms()
      fetchFacultyData()
      // Pre-select faculty if user is faculty
      if (user.role === 'Faculty') {
        setSelectedFaculty(user._id)
      }
    }
  }, [user?._id])

  useEffect(() => {
    if (selectedYear && selectedTerm && selectedFaculty) {
      console.log('🔄 Faculty Archive: Selected data changed:', {
        year: selectedYear,
        term: selectedTerm,
        faculty: selectedFaculty
      })
      fetchArchivedSchedules()
    } else {
      setSchedules([])
    }
  }, [selectedYear, selectedTerm, selectedFaculty])

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  const fetchFacultyData = async () => {
    try {
      const response = await getFacultyArchive()
      if (response.error) throw new Error(response.error)
      
      console.log('✅ Faculty data fetched:', {
        count: response.faculty?.length || 0,
        sample: response.faculty?.[0] ? {
          name: `${response.faculty[0].lastName}, ${response.faculty[0].firstName}`,
          role: response.faculty[0].role
        } : null
      })
      
      setFaculty(response.faculty || [])
    } catch (error) {
      console.error("❌ Error fetching faculty data:", error)
    }
  }

  const fetchArchivedTerms = async () => {
    try {
      const response = await getArchivedTerms()
      if (response.error) throw new Error(response.error)
      setArchivedTerms(response.terms)
    } catch (error) {
      console.error("Error fetching archived terms:", error)
    }
  }

  const fetchArchivedSchedules = async () => {
    setIsLoading(true)
    try {
      const response = await getArchivedSchedules(selectedYear, selectedTerm)
      if (response.error) throw new Error(response.error)

      // Filter schedules for selected faculty
      const facultySchedules = response.schedules.filter(
        schedule => schedule.faculty?._id === selectedFaculty
      )

      setSchedules(facultySchedules)
      console.log('✅ Faculty schedules fetched:', facultySchedules.length)
    } catch (error) {
      console.error("❌ Error fetching archived schedules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const convertSchedulesToEvents = (schedules) => {
    if (!schedules.length) return []

    return schedules.flatMap((schedule) => {
      return schedule.scheduleSlots.flatMap((slot) => {
        return slot.days.map((day) => {
          const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
            Thursday: 4, Friday: 5, Saturday: 6
          }

          const dayNumber = dayMap[day]
          const thisWeek = moment()
          thisWeek.day(dayNumber)
          const dateStr = thisWeek.format("YYYY-MM-DD")

          const startTime = moment(slot.timeFrom, "h:mm A").format("HH:mm:ss")
          const endTime = moment(slot.timeTo, "h:mm A").format("HH:mm:ss")

          return {
            id: `${schedule._id}-${day}`,
            title: `${schedule.subject.subjectCode} - ${slot.room.roomCode}`,
            subtitle: schedule.section.sectionName,
            start: `${dateStr}T${startTime}`,
            end: `${dateStr}T${endTime}`,
            extendedProps: {
              schedule: {
                ...schedule,
                timeFrom: slot.timeFrom,
                timeTo: slot.timeTo,
                days: [day],
                room: slot.room,
              },
            },
            backgroundColor: "#3b82f6",
            borderColor: "#3b7ddb",
          }
        })
      })
    })
  }

  const handlePrint = async () => {
    if (!selectedFaculty || !selectedTerm) return;
    
    try {
      const activeTerm = archivedTerms[selectedYear]?.find(t => t._id === selectedTerm);
      const selectedFacultyName = facultyOptions.find(f => f.value === selectedFaculty)?.label;
      
      const facultySchedules = schedules.filter(schedule => 
        schedule.faculty?._id === selectedFaculty
      );

      const doc = await FacultyArchivePDF({ 
        activeTerm,
        schedules: facultySchedules,
        selectedSection: selectedFacultyName
      });

      doc.save(`archived-faculty-schedule-${selectedFacultyName}-${activeTerm?.term || ''}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const FacultyOption = ({ children, ...props }) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <User className={`h-4 w-4 ${props.isSelected ? "text-white" : "text-gray-500"}`} />
          {children}
        </div>
      </components.Option>
    )
  }

  const yearOptions = Object.keys(archivedTerms).map(year => ({
    value: year,
    label: `AY ${year}`
  }))

  const termOptions = selectedYear 
    ? archivedTerms[selectedYear]?.map(term => ({
        value: term._id,
        label: term.term,
        academicYear: term.academicYear
      })) || []
    : []

  const facultyOptions = faculty.map(f => ({
    value: f._id,
    label: `${f.lastName}, ${f.firstName}`
  }))

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      paddingLeft: "28px",
      borderColor: "#e5e7eb",
      borderRadius: "0.5rem",
      boxShadow: "none",
      backgroundColor: "white",
      color: "#1f2937",
      "& .text-gray-500": {
        color: state.hasValue ? "#6b7280" : "#9ca3af"
      },
      "&:hover": {
        borderColor: "#d1d5db",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      position: 'absolute',
      width: '100%',
      backgroundColor: "white",
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f3f4f6" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: "#1f2937"
    }),
    input: (base) => ({
      ...base,
      color: "#1f2937"
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280"
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Faculty Schedule Archive</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            View and explore past faculty schedules by selecting filters below.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 text-black">
            {/* Year Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Academic Year</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <NoSSRSelect
                  value={yearOptions.find(opt => opt.value === selectedYear)}
                  onChange={(option) => {
                    setSelectedYear(option?.value || null)
                    setSelectedTerm(null)
                    // Only reset faculty selection if user is not faculty
                    if (user?.role !== 'Faculty') {
                      setSelectedFaculty(null)
                    }
                  }}
                  options={yearOptions}
                  placeholder="Select Academic Year"
                  className="w-full"
                  styles={selectStyles}
                  menuPortalTarget={portalTarget}
                  menuPosition="fixed"
                />
              </div>
            </div>

            {/* Term Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Term</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <NoSSRSelect
                  value={termOptions.find(opt => opt.value === selectedTerm)}
                  onChange={(option) => {
                    setSelectedTerm(option?.value || null)
                    // Only reset faculty selection if user is not faculty
                    if (user?.role !== 'Faculty') {
                      setSelectedFaculty(null)
                    }
                  }}
                  options={termOptions}
                  placeholder="Select Term"
                  className="w-full"
                  isDisabled={!selectedYear}
                  styles={selectStyles}
                  menuPortalTarget={portalTarget}
                  menuPosition="fixed"
                />
              </div>
            </div>

            {/* Faculty Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Faculty</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <NoSSRSelect
                  value={facultyOptions.find(opt => opt.value === selectedFaculty)}
                  onChange={(option) => setSelectedFaculty(option?.value)}
                  options={facultyOptions}
                  placeholder="Select Faculty"
                  className="w-full"
                  components={{
                    Option: FacultyOption
                  }}
                  styles={selectStyles}
                  menuPortalTarget={portalTarget}
                  menuPosition="fixed"
                  isDisabled={user?.role === 'Faculty'}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePrint}
              disabled={!selectedFaculty || !selectedTerm}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium 
                ${!selectedFaculty || !selectedTerm 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <span className="hidden sm:inline">Generate</span> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TabNav />
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200"></div>
              <div className="h-[400px] w-full animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      ) : selectedFaculty ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="p-0 sm:p-2">
            <ArchiveCalendarView events={convertSchedulesToEvents(schedules)} />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="flex h-[400px] flex-col items-center justify-center p-6 text-center">
            <Calendar className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-semibold text-gray-700">No Schedule Selected</h3>
            <p className="max-w-md text-gray-500">
              Please select an academic year, term and faculty to view archived schedules.
            </p>
          </div>
        </div>
      )}

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

        .dark .shadow-sm {
          --tw-shadow-color: rgba(0, 0, 0, 0.2);
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

        .dark .hover\\:bg-gray-50:hover {
          background-color: #374151;
        }
      `}</style>
    </div>
  )
}
