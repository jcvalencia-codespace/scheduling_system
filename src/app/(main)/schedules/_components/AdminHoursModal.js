'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import moment from 'moment';
import Swal from 'sweetalert2';
import { saveAdminHours, getAdminHours, editAdminHours, getFullTimeUsers, getActiveTerm, cancelAdminHours } from '../_actions/index';
import { AdminHoursModalSkeleton } from './Skeleton';
import { pusherClient } from '@/utils/pusher';

const DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
].map(day => ({ value: day, label: day }));

const TIME_OPTIONS = Array.from({ length: 30 }, (_, i) => {
    const time = moment().startOf('day').add(7, 'hours').add(i * 30, 'minutes');
    return {
        value: time.format('h:mm A'),
        label: time.format('h:mm A')
    };
});

// Utility functions moved to the top
const calculateDuration = (startTime, endTime) => {
    const start = moment(startTime, 'h:mm A');
    const end = moment(endTime, 'h:mm A');
    return end.diff(start, 'minutes') / 60;
};

export default function AdminHoursModal({ isOpen, onClose, maxHours, currentUser, termId }) {
    // Utility function needed by hooks
    const calculateTotalHours = (currentSlots) => {
        const total = currentSlots.reduce((acc, slot) => {
            if (slot.startTime && slot.endTime) {
                return acc + calculateDuration(slot.startTime, slot.endTime);
            }
            return acc;
        }, 0);
        return Math.round(total * 100) / 100;
    };

    // State declarations
    const [selectedUser, setSelectedUser] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [slots, setSlots] = useState([]);
    const [existingSlots, setExistingSlots] = useState([]);
    const [totalHours, setTotalHours] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [termInfo, setTermInfo] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);

    const isAdmin = currentUser?.role === 'Administrator';
    const isDean = currentUser?.role === 'Dean';
    const canSelectUser = isAdmin || isDean;

    // useEffect hooks
    useEffect(() => {
        if (isOpen) {
            if (canSelectUser) {
                loadAvailableUsers();
            } else if (currentUser) {
                setSelectedUser(currentUser);
            }

            // Check if we have valid termId
            validateTerm();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (isOpen && selectedUser && termId) {
            setIsLoading(true);
            loadExistingHours().finally(() => {
                setIsLoading(false);
            });
        } else if (!isOpen) {
            setSlots([]);
            setExistingSlots([]);
            setTotalHours(0);
        }
    }, [isOpen, selectedUser, termId]);

    useEffect(() => {
        setTotalHours(calculateTotalHours(slots));
    }, [slots]);

    useEffect(() => {
        const fetchTermInfo = async () => {
            if (termId) {
                try {
                    const { term, error } = await getActiveTerm();
                    if (error) throw new Error(error);
                    setTermInfo(term);
                } catch (error) {
                    console.error('Error fetching term info:', error);
                }
            }
        };

        if (isOpen) {
            fetchTermInfo();
        }
    }, [isOpen, termId]);

    useEffect(() => {
        if (!isOpen || !selectedUser) return;

        const channel = pusherClient.subscribe('admin-hours');

        channel.bind('request-updated', (data) => {
            // Update existing slots if they match current user
            if (data.request.user._id === selectedUser._id) {
                const updatedSlots = data.request.slots.map(slot => ({
                    ...slot,
                    status: slot.status || 'pending',
                    adminHoursId: data.request._id
                }));
                setExistingSlots(updatedSlots);
            }
        });

        // Cleanup subscription
        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe('admin-hours');
        };
    }, [isOpen, selectedUser]);

    if (!currentUser) {
        return null;
    }

    // Add term validation
    const validateTerm = () => {
        if (!termId) {
            Swal.fire({
                icon: 'error',
                title: 'No Active Term',
                text: 'Please ensure there is an active term before setting admin hours.',
                confirmButtonColor: '#323E8F'
            });
            onClose();
            return false;
        }
        return true;
    };

    // Event handlers and other functions
    const handleClose = () => {
        setSlots([]);
        setExistingSlots([]);
        setTotalHours(0);
        setEditingSlot(null);
        onClose();
    };

    const loadAvailableUsers = async () => {
        try {
            setIsLoading(true);
            console.log('Fetching users...');
            const { users, error } = await getFullTimeUsers();
            
            if (error) {
                console.error('Error from API:', error);
                throw new Error(error);
            }
            
            console.log('Fetched users:', users);
            if (!users || users.length === 0) {
                console.log('No users returned from API');
            }
            
            setAvailableUsers(users || []);
        } catch (error) {
            console.error('Error loading users:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load available users: ' + error.message,
                confirmButtonColor: '#323E8F'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadExistingHours = async () => {
        try {
            const { hours, error } = await getAdminHours(selectedUser._id, termId);
            if (error) throw new Error(error);
            
            if (hours && hours.slots) {
                const activeSlots = hours.slots.filter(slot => 
                    ['pending', 'approved', 'rejected'].includes(slot.status)
                ).map(slot => ({
                    ...slot,
                    adminHoursId: hours._id
                }));
                setExistingSlots(activeSlots);
            } else {
                setExistingSlots([]);
            }
            
            setSlots([]);
        } catch (error) {
            console.error('Error loading admin hours:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load existing admin hours',
                confirmButtonColor: '#323E8F'
            });
        }
    };

    const handleAddSlot = () => {
        setSlots([...slots, { day: '', startTime: '', endTime: '' }]);
    };

    const handleDeleteSlot = (index, isExisting = false) => {
        if (isExisting) {
            setExistingSlots(existingSlots.filter((_, i) => i !== index));
        } else {
            setSlots(slots.filter((_, i) => i !== index));
        }
    };

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };

        if ((field === 'startTime' || field === 'endTime') &&
            newSlots[index].startTime && newSlots[index].endTime) {
            const duration = calculateDuration(newSlots[index].startTime, newSlots[index].endTime);
            if (duration <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Time Range',
                    text: 'End time must be after start time',
                    confirmButtonColor: '#323E8F'
                });
                return;
            }
        }

        setSlots(newSlots);
    };

    const handleEdit = async (adminHoursId, slot) => {
        setEditingSlot({
            adminHoursId,
            slotId: slot._id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
        });

        // Add a single slot to the slots array for editing
        setSlots([{
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
        }]);
    };

    const handleSave = async () => {
        try {
            if (!validateTerm()) return;

            setIsLoading(true);

            if (editingSlot) {
                // Handle edit mode
                const response = await editAdminHours(
                    editingSlot.adminHoursId,
                    editingSlot.slotId,
                    slots[0] // We only allow editing one slot at a time
                );

                if (response.error) {
                    throw new Error(response.error);
                }
            } else {
                // Handle new submission mode
                if (!selectedUser) {
                    throw new Error('Please select a user');
                }

                console.log('Using Term ID:', termId); // Debug log

                if (totalHours > maxHours) {
                    throw new Error(`Total hours cannot exceed ${maxHours}`);
                }

                const invalidSlots = slots.filter(slot => !slot.day || !slot.startTime || !slot.endTime);
                if (invalidSlots.length > 0) {
                    throw new Error('Please fill in all time slot details');
                }

                const response = await saveAdminHours(
                    selectedUser._id,
                    termId,
                    slots,
                    currentUser._id,
                    currentUser.role
                );

                if (response.error) {
                    throw new Error(response.error);
                }
            }

            await loadExistingHours();
            setEditingSlot(null);
            setSlots([]);

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: editingSlot ? 'Admin hours updated successfully' : 'Admin hours saved successfully',
                confirmButtonColor: '#323E8F'
            });
        } catch (error) {
            console.error('Save error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#323E8F'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelRequest = async (adminHoursId) => {
        try {
            const result = await Swal.fire({
                title: 'Cancel Request?',
                text: 'Are you sure you want to cancel this admin hours request?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#323E8F',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, cancel it!',
                cancelButtonText: 'No, keep it'
            });

            if (result.isConfirmed) {
                setIsLoading(true);
                const response = await cancelAdminHours(adminHoursId);
                
                if (response.error) {
                    throw new Error(response.error);
                }

                // Only refresh and show success if no error
                await loadExistingHours();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Cancelled!',
                    text: response.message || 'Admin hours request has been cancelled.',
                    confirmButtonColor: '#323E8F'
                });
            }
        } catch (error) {
            console.error('Error cancelling request:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to cancel admin hours request',
                confirmButtonColor: '#323E8F'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-6xl sm:my-8 sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        onClick={handleClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                            Set Weekly Admin Hours
                                        </Dialog.Title>

                                        {isLoading || !termInfo ? (
                                            <AdminHoursModalSkeleton />
                                        ) : (
                                            <>
                                                <div className="mb-4 bg-gray-50 rounded-md p-3 text-sm">
                                                    <p className="text-gray-700">
                                                        Active Term: {termInfo ? (
                                                            <span className="font-medium">
                                                                {termInfo.academicYear} - {termInfo.term}
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500">No active term</span>
                                                        )}
                                                    </p>
                                                    {termId && (
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Term ID: {termId}
                                                        </p>
                                                    )}
                                                </div>

                                                {canSelectUser ? (
                                                    <Select
                                                        options={availableUsers.map(user => ({
                                                            value: user._id,
                                                            label: `${user.lastName}, ${user.firstName}${user.department ? ` (${user.department.departmentCode})` : ''}`
                                                        }))}
                                                        onChange={(option) => {
                                                            const selectedUser = availableUsers.find(u => u._id === option.value);
                                                            console.log('Selected user:', selectedUser);
                                                            setSelectedUser(selectedUser);
                                                        }}
                                                        isLoading={isLoading}
                                                        className="mb-4 text-black"
                                                        placeholder="Select user..."
                                                        noOptionsMessage={() => "No users available"}
                                                    />
                                                ) : (
                                                    <div className="mb-4 px-3 py-2 bg-gray-100 rounded text-black">
                                                        {currentUser.firstName} {currentUser.lastName} ({currentUser.role})
                                                    </div>
                                                )}

                                                <div className="mt-6 bg-white rounded-lg border border-gray-200">
                                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                        <h4 className="text-base font-semibold text-gray-900">
                                                            Submitted Admin Hours
                                                        </h4>
                                                    </div>
                                                    <div className="p-4">
                                                        {existingSlots.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                                                                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                                                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200">
                                                                        {existingSlots.map((slot, index) => (
                                                                            <tr key={index}>
                                                                                <td className="px-3 py-2 text-sm text-gray-900">{slot.day}</td>
                                                                                <td className="px-3 py-2 text-sm text-gray-900">
                                                                                    {slot.startTime} - {slot.endTime}
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                                        slot.status === 'approved' 
                                                                                            ? 'bg-green-100 text-green-800'
                                                                                            : slot.status === 'rejected'
                                                                                            ? 'bg-red-100 text-red-800'
                                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                                    }`}>
                                                                                        {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <div className="flex items-center space-x-2">
                                                                                        {slot.status === 'pending' && (
                                                                                            <>
                                                                                                <button
                                                                                                    onClick={() => handleEdit(slot.adminHoursId, slot)}
                                                                                                    className="text-blue-600 hover:text-blue-800"
                                                                                                >
                                                                                                    <PencilSquareIcon className="h-4 w-4" />
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleCancelRequest(slot.adminHoursId)}
                                                                                                    className="text-red-600 hover:text-red-800"
                                                                                                >
                                                                                                    <XMarkIcon className="h-4 w-4" />
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                        {slot.status === 'rejected' && (
                                                                                            <span className="text-sm text-red-600">
                                                                                                {slot.rejectionReason || 'No reason provided'}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No admin hours submitted yet.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-6 bg-white rounded-lg border border-gray-200">
                                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                        <h4 className="text-base font-semibold text-gray-900">
                                                            {editingSlot ? 'Edit Admin Hours' : 'Add New Admin Hours'}
                                                        </h4>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                                                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                                                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                                                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                                                        <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {slots.map((slot, index) => (
                                                                        <tr key={index}>
                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                <Select
                                                                                    options={DAYS}
                                                                                    value={DAYS.find(d => d.value === slot.day)}
                                                                                    onChange={(option) => handleSlotChange(index, 'day', option.value)}
                                                                                    className="w-36"
                                                                                    menuPlacement="auto"
                                                                                />
                                                                            </td>
                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                <Select
                                                                                    options={TIME_OPTIONS}
                                                                                    value={TIME_OPTIONS.find(t => t.value === slot.startTime)}
                                                                                    onChange={(option) => handleSlotChange(index, 'startTime', option.value)}
                                                                                    className="w-32"
                                                                                    menuPlacement="auto"
                                                                                />
                                                                            </td>
                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                <Select
                                                                                    options={TIME_OPTIONS}
                                                                                    value={TIME_OPTIONS.find(t => t.value === slot.endTime)}
                                                                                    onChange={(option) => handleSlotChange(index, 'endTime', option.value)}
                                                                                    className="w-32"
                                                                                    menuPlacement="auto"
                                                                                />
                                                                            </td>
                                                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                                {slot.startTime && slot.endTime
                                                                                    ? `${calculateDuration(slot.startTime, slot.endTime)} hrs`
                                                                                    : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                <button
                                                                                    onClick={() => handleDeleteSlot(index)}
                                                                                    className="text-red-600 hover:text-red-800"
                                                                                >
                                                                                    <TrashIcon className="h-5 w-5" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-4">
                                                            {!editingSlot && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddSlot}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E]"
                                                                >
                                                                    Add New Row
                                                                </button>
                                                            )}
                                                            <div className="text-sm font-medium text-gray-900">
                                                                Total Admin Hours: {totalHours} / {maxHours}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="button"
                                                        className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] sm:ml-3 sm:w-auto"
                                                        onClick={handleSave}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? 'Saving...' : editingSlot ? 'Update' : 'Save'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                        onClick={handleClose}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
