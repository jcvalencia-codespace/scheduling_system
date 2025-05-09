'use client';

import { useState, useEffect } from 'react';
import { getAdminHourRequests, approveAdminHours } from '../schedules/_actions';
import useAuthStore from '@/store/useAuthStore';
import moment from 'moment';
import Swal from 'sweetalert2';
import { pusherClient } from '@/utils/pusher';
import NoData from '@/app/components/NoData';
import AdminHoursSkeleton from './_components/Skeleton';

export default function AdminHoursRequestPage() {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, cancelled

    const setupPusherSubscription = () => {
        const channel = pusherClient.subscribe('admin-hours');

        // Helper function to check if a request has slots matching current filter
        const hasMatchingSlots = (request) => {
            return request.slots.some(slot => slot.status === filter);
        };

        channel.bind('new-request', (data) => {
            console.log('New request received:', data); 
            setRequests(prev => {
                const currentRequests = [...prev];
                const existingIndex = currentRequests.findIndex(r => r._id === data.request._id);
                
                if (existingIndex >= 0) {
                    // Only update if the request has slots matching the current filter
                    if (hasMatchingSlots(data.request)) {
                        currentRequests[existingIndex] = data.request;
                        return currentRequests;
                    }
                    // Remove if no matching slots
                    return currentRequests.filter(r => r._id !== data.request._id);
                }
                
                // Add new request if it has matching slots
                if (hasMatchingSlots(data.request)) {
                    return [data.request, ...currentRequests];
                }
                
                return currentRequests;
            });
        });

        channel.bind('request-updated', (data) => {
            console.log('Request updated:', data); 
            setRequests(prev => {
                const currentRequests = [...prev];
                const updatedRequest = data.request;
                
                // Remove any existing version of this request
                const filteredRequests = currentRequests.filter(req => req._id !== updatedRequest._id);
                
                // Only add back if it has slots matching current filter
                if (hasMatchingSlots(updatedRequest)) {
                    return [updatedRequest, ...filteredRequests];
                }
                
                return filteredRequests;
            });
        });

        return () => {
            try {
                channel.unbind_all();
                pusherClient.unsubscribe('admin-hours');
            } catch (error) {
                console.error('Error cleaning up Pusher subscription:', error);
            }
        };
    };

    useEffect(() => {
        let cleanup;
        try {
            cleanup = setupPusherSubscription();
            loadRequests();
        } catch (error) {
            console.error('Error in useEffect:', error);
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, [filter]);

    const loadRequests = async () => {
        try {
            setIsLoading(true);
            const { requests: adminHourRequests, error } = await getAdminHourRequests(filter);
            
            if (error) throw new Error(error);
            
            // Filter requests to only include those with matching slot statuses
            const filteredRequests = adminHourRequests.filter(request => 
                request.slots.some(slot => slot.status === filter)
            );
            
            // Sort by most recent first
            const sortedRequests = filteredRequests.sort((a, b) => {
                // Find the most recent slot for each request
                const latestSlotA = a.slots.reduce((latest, slot) => 
                    (!latest || new Date(slot.createdAt) > new Date(latest.createdAt)) ? slot : latest
                );
                const latestSlotB = b.slots.reduce((latest, slot) => 
                    (!latest || new Date(slot.createdAt) > new Date(latest.createdAt)) ? slot : latest
                );
                
                return new Date(latestSlotB.createdAt) - new Date(latestSlotA.createdAt);
            });
            
            setRequests(sortedRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load requests',
                confirmButtonColor: '#323E8F'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (requestId, slotId, approved, rejectionReason = '') => {
        try {
            const response = await approveAdminHours(requestId, slotId, user._id, approved, rejectionReason);
            if (response.error) throw new Error(response.error);

            await loadRequests();

            Swal.fire({
                icon: 'success',
                title: `Request ${approved ? 'Approved' : 'Rejected'}`,
                text: `Admin hours request has been ${approved ? 'approved' : 'rejected'}.`,
                confirmButtonColor: '#323E8F'
            });
        } catch (error) {
            console.error('Error updating request:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#323E8F'
            });
        }
    };

    // Helper function to get status-specific messages
    const getStatusMessages = (status) => {
        const messages = {
            pending: {
                message: "No Pending Requests",
                description: "There are no admin hours requests awaiting your review at this time."
            },
            approved: {
                message: "No Approved Requests",
                description: "No admin hours requests have been approved yet."
            },
            rejected: {
                message: "No Rejected Requests",
                description: "There are no rejected admin hours requests to display."
            },
            cancelled: {
                message: "No Cancelled Requests",
                description: "There are no cancelled admin hours requests to display."
            }
        };
        return messages[status] || messages.pending;
    };

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
            <div className="flex h-full gap-4">
                <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden overflow-x border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold mb-6 text-black">Admin Hours Requests</h1>

                    {/* Filter Tabs */}
                    <div className="flex space-x-4 mb-6">
                        {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-md ${filter === status
                                    ? 'bg-[#323E8F] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <AdminHoursSkeleton />
                    ) : (
                        <div className="bg-white shadow rounded-lg">
                            {requests.some(request => request.slots.some(slot => slot.status === filter)) ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Requester
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Request Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Day & Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {requests.map((request) => (
                                            request.slots
                                                .filter(slot => slot.status === filter) // Filter slots by current status
                                                .map((slot) => (
                                                    <tr key={`${request._id}-${slot._id}`}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {request.user.lastName}, {request.user.firstName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {request.user.department?.departmentCode}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {moment(slot.createdAt).format('MMM D, YYYY')}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {moment(slot.createdAt).format('h:mm A')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {slot.day}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {slot.startTime} - {slot.endTime}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                slot.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                slot.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                slot.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {slot.status === 'pending' && (
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => handleApprove(request._id, slot._id, true)}
                                                                        className="text-green-600 hover:text-green-900"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            Swal.fire({
                                                                                title: 'Reject Request',
                                                                                input: 'text',
                                                                                inputLabel: 'Reason for rejection',
                                                                                inputPlaceholder: 'Enter reason...',
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: '#323E8F',
                                                                                cancelButtonColor: '#d33'
                                                                            }).then((result) => {
                                                                                if (result.isConfirmed) {
                                                                                    handleApprove(request._id, slot._id, false, result.value);
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <NoData 
                                    {...getStatusMessages(filter)}
                                    className="py-12"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
