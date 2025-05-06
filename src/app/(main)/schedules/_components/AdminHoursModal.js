'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import moment from 'moment';
import Swal from 'sweetalert2';
import { saveAdminHours, getAdminHours } from '../_actions/index';

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

export default function AdminHoursModal({ isOpen, onClose, userId, termId, maxHours }) {
    const [slots, setSlots] = useState([]);
    const [totalHours, setTotalHours] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        setSlots([]); // Clear slots
        setTotalHours(0); // Reset total hours
        onClose(); // Call parent close handler
    };

    useEffect(() => {
        if (isOpen && userId && termId) {
            setIsLoading(true);
            loadExistingHours().finally(() => {
                setIsLoading(false);
            });
        } else if (!isOpen) {
            setSlots([]); // Clear slots when modal closes
            setTotalHours(0); // Reset total hours
        }
    }, [isOpen, userId, termId]);

    useEffect(() => {
        calculateTotalHours();
    }, [slots]);

    const loadExistingHours = async () => {
        try {
            const { hours, error } = await getAdminHours(userId, termId);
            if (error) throw new Error(error);
            setSlots(hours.slots || []);
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

    const calculateDuration = (startTime, endTime) => {
        const start = moment(startTime, 'h:mm A');
        const end = moment(endTime, 'h:mm A');
        return end.diff(start, 'minutes') / 60;
    };

    const calculateTotalHours = () => {
        const total = slots.reduce((acc, slot) => {
            return acc + calculateDuration(slot.startTime, slot.endTime);
        }, 0);
        setTotalHours(Math.round(total * 100) / 100);
    };

    const handleAddSlot = () => {
        setSlots([...slots, { day: '', startTime: '', endTime: '' }]);
    };

    const handleDeleteSlot = (index) => {
        setSlots(slots.filter((_, i) => i !== index));
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

    const handleSave = async () => {
        try {
            if (totalHours > maxHours) {
                throw new Error(`Total hours cannot exceed ${maxHours}`);
            }

            const invalidSlots = slots.filter(slot => !slot.day || !slot.startTime || !slot.endTime);
            if (invalidSlots.length > 0) {
                throw new Error('Please fill in all time slot details');
            }

            setIsLoading(true);
            const { error } = await saveAdminHours(userId, termId, slots);
            if (error) throw new Error(error);

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Admin hours saved successfully',
                confirmButtonColor: '#323E8F'
            });
            handleClose();
        } catch (error) {
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

                                        <div className="mt-6 space-y-4">
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
                                                <button
                                                    type="button"
                                                    onClick={handleAddSlot}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E]"
                                                >
                                                    Add New Row
                                                </button>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Total Admin Hours: {totalHours} / {maxHours}
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
                                                {isLoading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                onClick={handleClose}
                                            >
                                                Cancel
                                            </button>
                                        </div>
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
