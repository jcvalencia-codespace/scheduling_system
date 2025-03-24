'use client';

import { useState, useEffect } from 'react';
import NewScheduleModal from './_components/NewScheduleModal';
import ViewScheduleModal from './_components/ViewScheduleModal';
import { getActiveTerm } from './_actions';
import { format } from 'date-fns';
import { useLoading } from '../../context/LoadingContext';
import { mockSchedules, mockSections } from '../../mockdata/mockSchedules';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SchedulePDF from './_components/SchedulePDF';
import PreviewPDFModal from './_components/PreviewPDFModal';


export default function HomePage() {
  const [selectedSection, setSelectedSection] = useState('');
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTerm, setActiveTerm] = useState(null);
  const { isLoading, setIsLoading } = useLoading();
  const [schedules, setSchedules] = useState([]);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);


  useEffect(() => {
    fetchActiveTerm();
    // Set mock schedules
    setSchedules(mockSchedules);
  }, []);

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

  // Generate time slots from 7am to 9pm
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    const hour12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'pm' : 'am';
    return `${hour12}:00 ${ampm}`;
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), 'MMMM d, yyyy');
  };

  const parseTime = (timeStr) => {
    // Convert "7:00 am" to hour number (0-23)
    const [time, period] = timeStr.toLowerCase().split(' ');
    const [hours] = time.split(':');
    const hourNum = parseInt(hours);
    if (period === 'pm' && hourNum !== 12) {
      return hourNum + 12;
    } else if (period === 'am' && hourNum === 12) {
      return 0;
    }
    return hourNum;
  };

  const getScheduleForTimeAndDay = (timeSlot, day) => {
    // Convert timeSlot format "7:00 am" to hour number
    const [time] = timeSlot.split(' ');
    const currentHour = parseInt(time);

    const schedule = schedules.find(schedule => {
      const fromHour = parseTime(schedule.timeFrom);
      const toHour = parseTime(schedule.timeTo);

      return schedule.days.includes(day) &&
        (selectedSection === '' || schedule.sectionName === selectedSection) &&
        currentHour === fromHour; // Only show at starting hour
    });

    return schedule;
  };

  const getScheduleHeight = (schedule) => {
    if (!schedule) return 1;
    const fromHour = parseTime(schedule.timeFrom);
    const toHour = parseTime(schedule.timeTo);
    return (toHour - fromHour) * 4; // Multiply by 4 for larger blocks
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setIsViewScheduleModalOpen(true);
  };

  const renderScheduleCell = (schedule) => {
    if (!schedule) return null;

    const height = getScheduleHeight(schedule);

    return (
      <div
        className="absolute inset-x-0 bg-[#4285F4] text-white overflow-hidden z-10 cursor-pointer hover:bg-blue-600 transition-colors"
        style={{
          height: `${height}rem`,
          top: '0',
          left: '1px',
          right: '1px',
          padding: '0.5rem'
        }}
        onClick={() => handleScheduleClick(schedule)}
      >
        <div className="text-xs space-y-1">
          <div className="font-semibold">{schedule.timeFrom} - {schedule.timeTo}</div>
          <div className="font-semibold">{schedule.subjectCode}</div>
          <div>{schedule.building}</div>
          <div>{schedule.room.roomCode}</div>
          <div>{schedule.faculty.firstName} {schedule.faculty.lastName}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-gray-100">
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
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
            View Schedule of Section:
          </label>
          <div className="relative w-full sm:w-auto min-w-[240px]">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {mockSections.map((section) => (
                <option key={section.id} value={section.sectionName}>
                  {section.sectionName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule Title */}
        <div className="text-center my-6">
          {activeTerm ? (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Schedule for {activeTerm.term}
              </h2>
              <p className="mt-1 text-sm text-gray-600">SY - {activeTerm.academicYear}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {formatDate(activeTerm.startDate)} - {formatDate(activeTerm.endDate)}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                No Active Term
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please set an active term in the Term Management page to view schedules.
              </p>
            </div>
          )}
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="w-20 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className="bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[16%]"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {timeSlots.map((time, i) => (
                    <tr key={time} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500 border-r">
                        {time}
                      </td>
                      {weekDays.map((day) => {
                        const schedule = getScheduleForTimeAndDay(time, day);
                        return (
                          <td
                            key={`${day}-${time}`}
                            className="relative h-16 border-r last:border-r-0"
                            style={{
                              minHeight: '4rem',
                              position: 'relative'
                            }}
                          >
                            {renderScheduleCell(schedule)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <NewScheduleModal
          isOpen={isNewScheduleModalOpen}
          onClose={() => setIsNewScheduleModalOpen(false)}
          activeTerm={activeTerm}
          onScheduleCreated={(newSchedule) => {
            setSchedules(prev => [...prev, newSchedule]);
          }}
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
            selectedSection
          }}
        />
      </div>
    </div>
  );
}
