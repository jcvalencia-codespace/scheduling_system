import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UsersIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ArrowsRightLeftIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { deleteSchedule, deleteAdminHours } from '../_actions';
import NewScheduleModal from './NewScheduleModal';
import EditAdminHoursModal from './EditAdminHoursModal';

// Add useAuthStore to imports
import useAuthStore from '@/store/useAuthStore';

export default function ViewScheduleModal({ 
  isOpen, 
  onClose, 
  schedule,
  onScheduleDeleted, // Add this prop
  onScheduleUpdated  // Add this prop if not already present
}) {
  const [isEditAdminHoursModalOpen, setIsEditAdminHoursModalOpen] = useState(false);
  // Add user from auth store
  const { user } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(schedule);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update currentSchedule when schedule prop changes
  useEffect(() => {
    setCurrentSchedule(schedule);
  }, [schedule]);

  const handleEditClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (onScheduleUpdated) {
      onScheduleUpdated();
    }
    onClose();
  };

  const handleAdminHoursEditSuccess = (updatedHours) => {
    setIsEditAdminHoursModalOpen(false);
    if (onScheduleUpdated) {
      onScheduleUpdated(updatedHours);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (currentSchedule.isAdminHours) {
      try {
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#1a237e',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
          setIsDeleting(true);

          // Get the correct IDs
          const adminHoursId = currentSchedule.parentId;  // Parent document ID
          const slotId = currentSchedule._id;            // Individual slot ID

          // Debug log
          console.log('Deleting admin hours:', {
            adminHoursId,
            slotId,
            currentSchedule
          });

          if (!adminHoursId || !slotId) {
            throw new Error('Missing required IDs for deleting admin hours');
          }

          const response = await deleteAdminHours(adminHoursId, slotId);
          
          if (response.error) {
            throw new Error(response.error);
          }

          await Swal.fire({
            title: 'Deleted!',
            text: 'Admin hours have been deleted.',
            icon: 'success',
            timer: 1500
          });

          // Ensure we call both callbacks
          if (onClose) {
            onClose();
          }
          if (onScheduleDeleted) {
            onScheduleDeleted();
          }
        }
      } catch (error) {
        console.error('Error deleting admin hours:', error);
        await Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to delete admin hours',
          icon: 'error'
        });
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    // Regular schedule deletion logic
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1a237e',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setIsDeleting(true);
        const response = await deleteSchedule(schedule._id, user._id);
        
        if (response.error) {
          throw new Error(response.error);
        }

        await Swal.fire({
          title: 'Deleted!',
          text: 'Schedule has been deleted.',
          icon: 'success',
          timer: 1500
        });

        onClose();
        // Call onScheduleDeleted callback if provided
        if (onScheduleDeleted) {
          onScheduleDeleted();
        }
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      await Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to delete schedule',
        icon: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (currentSchedule.isAdminHours) {
      setIsEditAdminHoursModalOpen(true);
      return;
    }
    onClose(); // Close view modal first
    setIsEditModalOpen(true); // Then open edit modal
  };

  const canEditAdminHours = () => {
    if (!user || !currentSchedule?.isAdminHours) return false;
    
    // Admins can edit all admin hours
    if (user.role === 'Administrator') return true;
    
    // Deans can only edit admin hours for faculty in their department
    if (user.role === 'Dean') {
      return currentSchedule.faculty?.department?._id === user.department;
    }
    
    return false;
  };

  if (!currentSchedule) return null;
  const isAdminHours = currentSchedule.isAdminHours;

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-3xl">
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="px-6 py-5">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-5">
                      {isAdminHours ? 'Admin Hours Details' : 'View Schedule Details'}
                    </Dialog.Title>

                    {/* School Year and Term */}
                    <div className={`${isAdminHours ? 'bg-emerald-50/70' : 'bg-blue-50/70'} rounded-xl p-4 mb-6`}>
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className={`h-5 w-5 ${isAdminHours ? 'text-emerald-600' : 'text-blue-600'} flex-shrink-0`} />
                        <div>
                          <p className={`text-sm font-bold ${isAdminHours ? 'text-emerald-900' : 'text-blue-900'}`}>
                            Academic Year: {currentSchedule.term?.academicYear || 'N/A'}
                          </p>
                          <p className={`text-sm font-bold ${isAdminHours ? 'text-emerald-900' : 'text-blue-900'}`}>
                            {currentSchedule.term?.term || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6">
                      {/* Schedule/Admin Hours Details */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className={`${isAdminHours ? 'bg-[#579980]' : 'bg-[#323E8F]'} px-6 py-3 rounded-t-xl`}>
                          <h4 className="text-base font-semibold text-white">
                            {isAdminHours ? 'Admin Hours Details' : 'Schedule Details'}
                          </h4>
                        </div>
                        <div className="px-6 py-4">
                          <div className="space-y-6">
                            {/* Faculty Info */}
                            <div>
                              <div className="flex items-center gap-x-2 text-gray-600">
                                <UserIcon className="h-5 w-5" />
                                <p className="text-sm">
                                  {isAdminHours ? 'Faculty' : 'Scheduled for'}: {' '}
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {currentSchedule.faculty 
                                      ? `${currentSchedule.faculty.firstName} ${currentSchedule.faculty.lastName}` 
                                      : 'TBA (To Be Assigned)'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Time */}
                            <div>
                              <div className="flex items-center gap-x-2 text-gray-600">
                                <ClockIcon className="h-5 w-5" />
                                <p className="text-sm">
                                  Time: <span className="font-semibold text-gray-900 dark:text-white">
                                    {isAdminHours 
                                      ? `${currentSchedule.startTime} - ${currentSchedule.endTime}`
                                      : `${currentSchedule.timeFrom} - ${currentSchedule.timeTo}`}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Day */}
                            <div>
                              <div className="flex items-center gap-x-2 text-gray-600">
                                <CalendarIcon className="h-5 w-5" />
                                <p className="text-sm">
                                  Day: <span className="font-semibold text-gray-900 dark:text-white">
                                    {isAdminHours ? currentSchedule.day : currentSchedule.days?.join(', ')}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Show these fields only for regular schedules */}
                            {!isAdminHours && (
                              <>
                                <div>
                                  <div className="flex items-center gap-x-2 text-gray-600">
                                    <AcademicCapIcon className="h-5 w-5" />
                                    <p className="text-sm">
                                      Section: <span className="font-semibold text-gray-900 dark:text-white">
                                        {currentSchedule.section?.sectionName}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-x-2 text-gray-600">
                                    <BookOpenIcon className="h-5 w-5" />
                                    <p className="text-sm">
                                      Subject: <span className="font-semibold text-gray-900 dark:text-white">
                                        {currentSchedule.subject?.subjectCode} - {currentSchedule.subject?.subjectName}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-x-2 text-gray-600">
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <p className="text-sm">
                                      Room: <span className="font-semibold text-gray-900 dark:text-white">
                                        {currentSchedule.room?.roomCode}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Information - Only show for regular schedules */}
                      {!isAdminHours && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                          <div className="bg-[#323E8F] px-6 py-3 rounded-t-xl">
                            <h4 className="text-base font-semibold text-white">
                              Additional Information
                            </h4>
                          </div>
                          <div className="px-6 py-4">
                            <div className="space-y-6">
                              <div>
                                <div className="flex items-center gap-x-2 text-gray-600">
                                  <UsersIcon className="h-5 w-5" />
                                  <p className="text-sm">
                                    Class Limit: <span className="font-semibold text-gray-900 dark:text-white">
                                      {schedule?.classLimit || currentSchedule?.classLimit}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-x-2 text-gray-600">
                                  <UserGroupIcon className="h-5 w-5" />
                                  <p className="text-sm">
                                    Student Type: <span className="font-semibold text-gray-900 dark:text-white">
                                      {schedule?.studentType || currentSchedule?.studentType}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-x-2 text-gray-600">
                                  <PresentationChartLineIcon className="h-5 w-5" />
                                  <p className="text-sm">
                                    Schedule Type: <span className="font-semibold text-gray-900 dark:text-white">
                                      {(schedule?.scheduleType || currentSchedule?.scheduleType)?.charAt(0).toUpperCase() + 
                                       (schedule?.scheduleType || currentSchedule?.scheduleType)?.slice(1)}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-x-2 text-gray-600">
                                  <ArrowsRightLeftIcon className="h-5 w-5" />
                                  <p className="text-sm">
                                    Pairing: <span className="font-semibold text-gray-900 dark:text-white">
                                      {(schedule?.isPaired || currentSchedule?.isPaired) ? 'Yes' : 'No'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Hours Status - Only show for admin hours */}
                      {isAdminHours && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                          <div className="bg-[#579980] px-6 py-3 rounded-t-xl">
                            <h4 className="text-base font-semibold text-white">
                              Status Information
                            </h4>
                          </div>
                          <div className="px-6 py-4">
                            <div className="space-y-6">
                              <div>
                                <div className="flex items-center gap-x-2 text-gray-600">
                                  <UserGroupIcon className="h-5 w-5" />
                                  <p className="text-sm">
                                    Status: <span className="font-semibold text-gray-900">
                                      {currentSchedule.status?.charAt(0).toUpperCase() + currentSchedule.status?.slice(1)}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {(!isAdminHours || canEditAdminHours()) && (
                      <div className="mt-8 flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                          onClick={handleEditClick}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          {isAdminHours ? 'Edit Hours' : 'Edit'}
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
                          onClick={handleDelete}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          {isAdminHours ? 'Delete Hours' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-gray-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
                          onClick={onClose}
                        >
                          Close
                        </button>
                      </div>
                    )}

                    {/* Close button for admin hours
                    {isAdminHours && (
                      <div className="mt-8 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-gray-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
                          onClick={onClose}
                        >
                          Close
                        </button>
                      </div>
                    )} */}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Render appropriate modal based on schedule type */}
      {isAdminHours ? (
        <EditAdminHoursModal
          isOpen={isEditAdminHoursModalOpen}
          onClose={() => setIsEditAdminHoursModalOpen(false)}
          adminHours={currentSchedule}
          onSuccess={handleAdminHoursEditSuccess}
        />
      ) : (
        <NewScheduleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            onClose();
          }}
          onScheduleCreated={handleEditSuccess} // Changed from onScheduleDeleted to handleEditSuccess
          editMode={true}
          scheduleData={currentSchedule}
        />
      )}
    </>
  );
}