'use client';

export default function ConflictAlert({ 
  conflicts, 
  onDismiss, 
  onOverride, 
  overrideEnabled,
  setOverrideEnabled,
  hasShortDuration,
  currentScheduleDuration 
}) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWarningMessage = (type, conflict) => {
    switch(type) {
      case 'room':
        return 'Room allocation conflicts may disrupt ongoing classes and create logistical issues.';
      case 'faculty':
        return 'Faculty scheduling conflicts may affect teaching quality and cause unnecessary stress.';
      case 'section':
        return 'Section conflicts may prevent students from attending all their required classes.';
      default:
        return '';
    }
  };

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="ml-3 w-full">
          <h3 className="text-sm font-bold text-red-800">
            Schedule Conflicts Detected
          </h3>
          <div className="mt-2 text-sm text-red-700 space-y-4">
            {conflicts.durationConflicts && conflicts.durationConflicts.length > 0 && (
              <div className="mb-2">
                <strong>Duration Conflicts:</strong>
                <div className="bg-red-100 p-2 rounded mt-1 text-xs">
                  <p className="font-semibold">⚠️ Warning:</p>
                  <p>Schedule duration conflicts detected:</p>
                  <ul className="mt-1 pl-4 list-disc">
                    {conflicts.durationConflicts.map((conflict, idx) => (
                      <li key={`duration-${idx}`} className="mb-2">
                        <div className="font-medium">
                          Schedule from {conflict.timeFrom} to {conflict.timeTo}
                        </div>
                        <div className="text-red-700 ml-2">
                          {conflict.type === 'exceeded' ? (
                            <span>• Exceeds maximum 4-hour limit</span>
                          ) : (
                            <span>• Below minimum 2-hour requirement</span>
                          )}
                          <div className="mt-1 text-xs">
                            Current duration: {Math.floor(conflict.duration/60)}h {conflict.duration%60}m
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {conflicts.roomConflicts.length > 0 && (
              <div className="mb-2">
                <strong>Room Conflicts:</strong>
                <div className="bg-red-100 p-2 rounded mt-1 text-xs">
                  <p className="font-semibold">⚠️ Warning:</p>
                  <p>{getWarningMessage('room')}</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {conflicts.roomConflicts.map((conflict, idx) => (
                    <li key={`room-${idx}`}>
                      Room {conflict.room} is already booked on {conflict.day} from {conflict.timeFrom} to {conflict.timeTo}
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`room-schedule-${i}`} className="text-xs ml-2 pt-2">
                          • Conflicted Schedule: {schedule.section}: {schedule.timeFrom} - {schedule.timeTo} 
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {conflicts.facultyConflicts.length > 0 && (
              <div className="mb-2">
                <strong>Faculty Conflicts:</strong>
                <div className="bg-red-100 p-2 rounded mt-1 text-xs">
                  <p className="font-semibold">⚠️ Warning:</p>
                  <p>{getWarningMessage('faculty')}</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {conflicts.facultyConflicts.map((conflict, idx) => (
                    <li key={`faculty-${idx}`}>
                      {conflict.faculty} is already scheduled on {conflict.day} from {conflict.timeFrom} to {conflict.timeTo}
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`faculty-schedule-${i}`} className="text-xs ml-2">
                          • Section {schedule.section}: {schedule.timeFrom} - {schedule.timeTo}
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {conflicts.sectionConflicts.length > 0 && (
              <div>
                <strong>Section Conflicts:</strong>
                <div className="bg-red-100 p-2 rounded mt-1 text-xs">
                  <p className="font-semibold">⚠️ Warning:</p>
                  <p>{getWarningMessage('section')}</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {conflicts.sectionConflicts.map((conflict, idx) => (
                    <li key={`section-${idx}`}>
                      Section {conflict.section} already has classes on {conflict.day} from {conflict.timeFrom} to {conflict.timeTo}
                      {conflict.conflictingSchedules.map((schedule, i) => (
                        <div key={`section-schedule-${i}`} className="text-xs ml-2">
                          • {schedule.subject}: {schedule.timeFrom} - {schedule.timeTo}
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-red-200 pt-4">
            <div className="text-sm text-red-800">
              <h4 className="font-semibold mb-2">Schedule Duration Analysis:</h4>
              <div className="bg-red-100 p-3 rounded">
                <p className="mb-2">
                  Current Schedule Duration: <span className="font-bold">{formatDuration(currentScheduleDuration)}</span>
                </p>
                <p className="mb-2">
                  Minimum Required Duration: <span className="font-bold">{formatDuration(120)}</span>
                </p>
                {currentScheduleDuration < 120 && (
                  <div className="text-red-700 mt-2">
                    <p className="font-semibold">⚠️ Warning: Insufficient Duration</p>
                    <ul className="list-disc ml-4 mt-1 text-sm">
                      <li>May not meet required lecture hours</li>
                      <li>Could affect subject coverage</li>
                      <li>May impact learning effectiveness</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Dismiss
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableOverride"
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="enableOverride" className="ml-2 text-sm text-red-600">
                  I understand and accept the risks
                </label>
              </div>
              <button
                type="button"
                onClick={onOverride}
                disabled={!overrideEnabled}
                className={`text-sm font-medium text-white px-3 py-2 rounded-md ${
                  overrideEnabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Override Conflicts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
