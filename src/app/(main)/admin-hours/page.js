'use client';

import { useState, useEffect } from 'react';
import { getAdminHourRequests, approveAdminHours } from '../schedules/_actions';
import useAuthStore from '@/store/useAuthStore';
import moment from 'moment';
import Swal from 'sweetalert2';
import { pusherClient } from '@/utils/pusher';

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
            console.log('New request received:', data); // Debug log
            setRequests(prev => {
                // Deep clone the previous state to avoid reference issues
                const currentRequests = [...prev];
                
                // Find existing request index
                const existingIndex = currentRequests.findIndex(r => r._id === data.request._id);
                
                if (existingIndex >= 0) {
                    // If request exists and has matching slots, update it
                    if (hasMatchingSlots(data.request)) {
                        currentRequests[existingIndex] = data.request;
                        return currentRequests;
                    }
                    // If no matching slots, remove it
                    return currentRequests.filter(r => r._id !== data.request._id);
                }
                
                // If it's a new request with matching slots, add it
                if (hasMatchingSlots(data.request)) {
                    return [data.request, ...currentRequests];
                }
                
                return currentRequests;
            });
        });

        channel.bind('request-updated', (data) => {
            console.log('Request updated:', data); // Debug log
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
            
            // Filter and sort requests
            const filteredRequests = adminHourRequests
                .filter(request => request.slots.some(slot => slot.status === filter))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setRequests(filteredRequests);
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
                        <div>Loading...</div>
                    ) : (
                        <div className="bg-white shadow rounded-lg">
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
                                        request.slots.map((slot) => (
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
