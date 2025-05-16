"use client"

import { useState } from "react"

export default function ConflictAlert({
  conflicts,
  onDismiss,
  onOverride,
  overrideEnabled,
  setOverrideEnabled,
  hasShortDuration,
  currentScheduleDuration,
}) {
  // Track only the currently open accordion (or null if none are open)
  const [openAccordion, setOpenAccordion] = useState(null)

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getWarningMessage = (type) => {
    switch (type) {
      case "room":
        return "Room allocation conflicts may disrupt ongoing classes and create logistical issues."
      case "faculty":
        return "Faculty scheduling conflicts may affect teaching quality and cause unnecessary stress."
      case "section":
        return "Section conflicts may prevent students from attending all their required classes."
      case "duration":
        return "Schedule duration conflicts may affect required lecture hours and learning effectiveness."
      case "adminHours":
        return "Admin hours conflicts may affect faculty's administrative duties and responsibilities."
      case "subjectFrequency":
        return "A subject can only be scheduled up to 2 times per week for each section."
      default:
        return ""
    }
  }

  // Toggle accordion - if clicking the same one, close it; otherwise open the new one
  const toggleAccordion = (type) => {
    setOpenAccordion(openAccordion === type ? null : type)
  }

  const totalConflicts =
    (conflicts.roomConflicts?.length || 0) +
    (conflicts.facultyConflicts?.length || 0) +
    (conflicts.sectionConflicts?.length || 0) +
    (conflicts.durationConflicts && conflicts.durationConflicts.length > 0 ? 1 : 0) +
    (conflicts.adminHoursConflicts?.length || 0) // Add admin hours to total

  // Track which conflicts have been viewed
  const [viewedConflicts, setViewedConflicts] = useState({})

  // When an accordion opens, mark it as viewed
  const handleAccordionOpen = (type) => {
    if (type && !viewedConflicts[type]) {
      setViewedConflicts((prev) => ({
        ...prev,
        [type]: true,
      }))
    }
  }

  // Check if all conflicts have been viewed
  const allConflictsViewed = () => {
    const conflictTypes = []
    if (conflicts.roomConflicts?.length > 0) conflictTypes.push("room")
    if (conflicts.facultyConflicts?.length > 0) conflictTypes.push("faculty")
    if (conflicts.sectionConflicts?.length > 0) conflictTypes.push("section")
    if (conflicts.durationConflicts?.length > 0) conflictTypes.push("duration")
    if (conflicts.adminHoursConflicts?.length > 0) conflictTypes.push("adminHours") // Check for admin hours
    if (conflicts.subjectFrequencyConflicts?.length > 0) conflictTypes.push("subjectFrequency") // Check for subject frequency

    return conflictTypes.every((type) => viewedConflicts[type])
  }

  // Get appropriate description for each conflict type
  const getConflictDescription = (type) => {
    switch (type) {
      case "room":
        return "Room is already booked for another class at this time"
      case "faculty":
        return "Faculty member is already scheduled at this time"
      case "section":
        return "Section already has classes scheduled at this time"
      case "duration":
        return "Schedule duration does not meet requirements"
      case "adminHours":
        return "Administrative hours conflict with scheduled classes"
      case "subjectFrequency":
        return "Subject has exceeded maximum allowed weekly schedule frequency"
      default:
        return ""
    }
  }

  const renderConflictCard = (type, title, conflictItems, color = "bg-red-50", textColor = "text-red-800") => {
    if (!conflictItems || conflictItems.length === 0) return null

    // When this accordion opens, mark it as viewed
    if (openAccordion === type) {
      handleAccordionOpen(type)
    }

    // All warning icons are now red
    const iconColor = "text-red-500"

    // Get the appropriate description
    const description = getConflictDescription(type)

    // Determine description text color
    const descriptionColor = "text-red-700"

    return (
      <div className={`mb-3 border rounded-lg overflow-hidden ${color}`}>
        <div className="p-4">
          <div className="flex items-start">
            {/* Heroicon - Exclamation Triangle */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`${iconColor} mr-3 h-5 w-5 flex-shrink-0`}
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-grow">
              <h3 className={`font-medium ${textColor}`}>{title}</h3>
              <p className={`text-sm ${descriptionColor}`}>{description}</p>
            </div>
            <button onClick={() => toggleAccordion(type)} className="text-gray-500 hover:text-gray-700">
              {openAccordion === type ? (
                // Heroicon - Chevron Up
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Heroicon - Chevron Down
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {openAccordion === type && (
          <div className="px-4 pb-4 pt-0">
            <div className="mt-1 p-3 bg-white/60 rounded-md text-sm">
              {type === "duration" ? (
                <div>
                  <p className="mb-2 text-gray-800">
                    Current Schedule Duration:{" "}
                    <span className="font-medium">{formatDuration(currentScheduleDuration)}</span>
                  </p>
                  <p className="mb-2 text-gray-800">
                    Minimum Required Duration: <span className="font-medium">{formatDuration(120)}</span>
                  </p>
                  {currentScheduleDuration < 120 && (
                    <div className="text-amber-700 mt-2 text-xs">
                      <p className="font-medium">⚠️ Warning: Insufficient Duration</p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>May not meet required lecture hours</li>
                        <li>Could affect subject coverage</li>
                        <li>May impact learning effectiveness</li>
                      </ul>
                    </div>
                  )}
                  <ul className="mt-2 space-y-2">
                    {conflicts.durationConflicts.map((conflict, idx) => (
                      <li key={`duration-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                        <div className="font-medium text-sm text-gray-800">
                          Schedule from {conflict.timeFrom} to {conflict.timeTo}
                        </div>
                        <div className="text-amber-700 text-xs mt-1">
                          {conflict.type === "exceeded" ? (
                            <span>• Exceeds maximum 4-hour limit</span>
                          ) : (
                            <span>• Below minimum 2-hour requirement</span>
                          )}
                          <div className="mt-1">
                            Current duration: {Math.floor(conflict.duration / 60)}h {conflict.duration % 60}m
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : type === "room" ? (
                <ul className="space-y-2">
                  {conflicts.roomConflicts.map((conflict, idx) => (
                    <li key={`room-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                      <div className="font-medium text-sm text-gray-800">
                        Room {conflict.room} is already booked on {conflict.day} from {conflict.timeFrom} to{" "}
                        {conflict.timeTo}
                      </div>
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`room-schedule-${i}`} className="text-xs mt-1 text-red-700">
                          • Conflicted Schedule: {schedule.section}: {schedule.timeFrom} - {schedule.timeTo}
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              ) : type === "faculty" ? (
                <ul className="space-y-2">
                  {conflicts.facultyConflicts.map((conflict, idx) => (
                    <li key={`faculty-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                      <div className="font-medium text-sm text-gray-800">
                        {conflict.faculty} is already scheduled on {conflict.day} from {conflict.timeFrom} to{" "}
                        {conflict.timeTo}
                      </div>
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`faculty-schedule-${i}`} className="text-xs mt-1 text-red-700">
                          • Section {schedule.section}: {schedule.timeFrom} - {schedule.timeTo}
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              ) : type === "adminHours" ? (
                <ul className="space-y-2">
                  {conflicts.adminHoursConflicts.map((conflict, idx) => (
                    <li key={`admin-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                      <div className="font-medium text-sm text-gray-800">
                        Conflict with Administrative hours scheduled for <span className="text-red-700 font-semibold">{conflict.faculty}</span> 
                       
                      </div>
                      {conflict.conflictingSlots.map((slot, i) => (
                        <div key={`admin-slot-${i}`} className="text-xs mt-1 text-red-700">
                          • {slot.type} Hours: {slot.day}  ({slot.startTime} - {slot.endTime})
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              ) : type === "subjectFrequency" ? (
                <ul className="space-y-2">
                  {conflicts.subjectFrequencyConflicts.map((conflict, idx) => (
                    <li key={`subject-freq-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                      <div className="font-medium text-sm text-gray-800">
                        {conflict.subject} - Maximum Weekly Frequency Exceeded
                      </div>
                      <div className="text-xs mt-2 space-y-1">
                        <div className="text-red-700">
                          • Section {conflict.section}
                        </div>
                        <div className="text-gray-600">
                          Currently scheduled: {conflict.currentCount}{" "}
                          {conflict.currentCount === 1 ? "time" : "times"}
                        </div>
                        <div className="text-gray-600">
                          Attempting to add: {conflict.attemptedAdd}{" "}
                          {conflict.attemptedAdd === 1 ? "time" : "times"}
                        </div>
                        <div className="text-gray-600">
                          Maximum allowed: {conflict.maxAllowed} times per week
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {conflicts.sectionConflicts.map((conflict, idx) => (
                    <li key={`section-${idx}`} className="p-2 bg-white rounded-md shadow-sm">
                      <div className="font-medium text-sm text-gray-800">
                        Section {conflict.section} already has classes on {conflict.day} from {conflict.timeFrom} to{" "}
                        {conflict.timeTo}
                      </div>
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`section-schedule-${i}`} className="text-xs mt-1 text-red-700">
                          • {schedule.subject}: {schedule.timeFrom} - {schedule.timeTo}
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Check if only admin hours conflicts exist
  const hasOnlyAdminHoursConflicts =
    conflicts.adminHoursConflicts?.length > 0 &&
    !conflicts.roomConflicts?.length &&
    !conflicts.facultyConflicts?.length &&
    !conflicts.sectionConflicts?.length &&
    !conflicts.durationConflicts?.length &&
    !conflicts.subjectFrequencyConflicts?.length // Exclude subject frequency conflicts

  // Update the check for non-overridable conflicts
  const hasNonOverridableConflicts =
    (conflicts.adminHoursConflicts?.length > 0 || conflicts.subjectFrequencyConflicts?.length > 0);

  const showOverrideControls = !hasNonOverridableConflicts &&
    (conflicts.roomConflicts?.length > 0 ||
    conflicts.facultyConflicts?.length > 0 ||
    conflicts.sectionConflicts?.length > 0 ||
    conflicts.durationConflicts?.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              {/* Heroicon - Shield Check - Now Red */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 text-red-600"
              >
                <path
                  fillRule="evenodd"
                  d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.674 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm-.516 6.58a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5z"
                  clipRule="evenodd"
                />
                <circle cx="12.5" cy="17.5" r="1" fill="white" />

              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-red-400">Schedule Conflicts Detected</h2>
              <p className="text-gray-600 text-sm">
                We've identified {totalConflicts} potential schedule {totalConflicts === 1 ? "conflict" : "conflicts"}{" "}
                that require your attention
              </p>
            </div>
            <button onClick={onDismiss} className="ml-auto text-gray-400 hover:text-gray-600" aria-label="Close">
              {/* Heroicon - X Mark */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {/* Render non-overridable conflicts first */}
            {renderConflictCard(
              "adminHours",
              "Admin Hours Conflict",
              conflicts.adminHoursConflicts,
              "bg-red-50",
              "text-red-800"
            )}
            {renderConflictCard(
              "subjectFrequency",
              "Subject Frequency Conflict",
              conflicts.subjectFrequencyConflicts,
              "bg-red-50",
              "text-red-800"
            )}

            {/* Render overridable conflicts */}
            {renderConflictCard("room", "Room Schedule Conflict", conflicts.roomConflicts)}
            {renderConflictCard("faculty", "Faculty Schedule Conflict", conflicts.facultyConflicts)}
            {renderConflictCard("section", "Section Schedule Conflict", conflicts.sectionConflicts)}
            {renderConflictCard("duration", "Schedule Duration Conflict", conflicts.durationConflicts)}
          </div>

          {/* Show controls based on conflict type */}
          {showOverrideControls ? (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enableOverride"
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#35408E] border-gray-300 rounded focus:ring-[#35408E]"
                />
                <label htmlFor="enableOverride" className="ml-2 text-sm text-gray-700 dark:text-white">
                  I have reviewed all conflicts and understand the scheduling issues
                </label>
              </div>

              {(!overrideEnabled || !allConflictsViewed()) && (
                <p className="text-red-600 text-xs mb-4 flex items-cente dark:text-white">
                  {/* Heroicon - Exclamation Triangle (mini) - Now Red */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please review all conflicts by opening each accordion
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onOverride}
                  disabled={!overrideEnabled}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    overrideEnabled
                      ? "bg-[#35408E] hover:bg-[#2a3272]"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Acknowledge Conflicts
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
