"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import {
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"
import Select from "react-select"
import moment from "moment"
import Swal from "sweetalert2"
import {
  saveAdminHours,
  getAdminHours,
  editAdminHours,
  getFullTimeUsers,
  getActiveTerm,
  cancelAdminHours,
} from "../_actions/index"
import { AdminHoursModalSkeleton } from "./Skeleton"
import { pusherClient } from "@/utils/pusher"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => ({
  value: day,
  label: day,
}))

const TIME_OPTIONS = Array.from({ length: 45 }, (_, i) => {
  const time = moment()
    .startOf("day")
    .add(7, "hours")
    .add(i * 20, "minutes")
  return {
    value: time.format("h:mm A"),
    label: time.format("h:mm A"),
  }
})

// Utility functions moved to the top
const calculateDuration = (startTime, endTime) => {
  const start = moment(startTime, "h:mm A")
  const end = moment(endTime, "h:mm A")
  return end.diff(start, "minutes") / 60
}

// Custom select styles
const selectStyles = {
  control: (base) => ({
    ...base,

    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#cbd5e1",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#f1f5f9" : null,
    color: state.isSelected ? "white" : "#1e293b",
  }),
}

export default function AdminHoursModal({ isOpen, onClose, maxHours, currentUser, termId }) {
  // Utility function needed by hooks
  const calculateTotalHours = (currentSlots) => {
    const total = currentSlots.reduce((acc, slot) => {
      if (slot.startTime && slot.endTime) {
        return acc + calculateDuration(slot.startTime, slot.endTime)
      }
      return acc
    }, 0)
    return Math.round(total * 100) / 100
  }

  // State declarations
  const [selectedUser, setSelectedUser] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [slots, setSlots] = useState([])
  const [existingSlots, setExistingSlots] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [termInfo, setTermInfo] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)
  const [isSubmittedHoursOpen, setIsSubmittedHoursOpen] = useState(true)

  const isAdmin = currentUser?.role === "Administrator"
  const isDean = currentUser?.role === "Dean"
  const canSelectUser = isAdmin || isDean

  // Modify the resetForm function to be more specific
  const resetForm = (clearUser = false) => {
    if (clearUser && canSelectUser) {
      setSelectedUser(null)
    }
    setSlots([])
    setExistingSlots([])
    setTotalHours(0)
    setEditingSlot(null)
  }

  // useEffect hooks
  useEffect(() => {
    if (isOpen) {
      if (canSelectUser) {
        loadAvailableUsers()
      } else if (currentUser) {
        setSelectedUser(currentUser)
      }

      // Check if we have valid termId
      validateTerm()
    }
  }, [isOpen, currentUser])

  useEffect(() => {
    if (isOpen && selectedUser && termId) {
      setIsLoading(true);
      loadExistingHours()
        .then(() => {
          console.log('Initial admin hours loaded');
        })
        .catch(error => {
          console.error('Error loading initial admin hours:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, selectedUser, termId]);

  useEffect(() => {
    setTotalHours(calculateTotalHours(slots))
  }, [slots])

  useEffect(() => {
    const fetchTermInfo = async () => {
      if (termId) {
        try {
          const { term, error } = await getActiveTerm()
          if (error) throw new Error(error)
          setTermInfo(term)
        } catch (error) {
          console.error("Error fetching term info:", error)
        }
      }
    }

    if (isOpen) {
      fetchTermInfo()
    }
  }, [isOpen, termId])

  useEffect(() => {
    if (!isOpen || !selectedUser) return;

    const channel = pusherClient.subscribe("admin-hours");

    // Handle new requests
    channel.bind("new-request", (data) => {
      if (data.request.user._id === selectedUser._id) {
        handleRealTimeUpdate(data.request);
      }
    });

    // Handle request updates (approvals, rejections, edits)
    channel.bind("request-updated", (data) => {
      if (data.request.user._id === selectedUser._id) {
        handleRealTimeUpdate(data.request);
        // Clear editing state if the edited slot was updated
        if (editingSlot && data.request.slots.some(slot => slot._id === editingSlot.slotId)) {
          setEditingSlot(null);
          setSlots([]);
        }
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("admin-hours");
    };
  }, [isOpen, selectedUser, editingSlot]);

  if (!currentUser) {
    return null
  }

  // Add term validation
  const validateTerm = () => {
    if (!termId) {
      Swal.fire({
        icon: "error",
        title: "No Active Term",
        text: "Please ensure there is an active term before setting admin hours.",
        confirmButtonColor: "#4f46e5",
      })
      onClose()
      return false
    }
    return true
  }

  // Event handlers and other functions
  const handleClose = () => {
    resetForm(true) // Pass true to also clear user selection
    onClose()
  }

  const loadAvailableUsers = async () => {
    try {
      setIsLoading(true);

      // Validate user role and department for deans
      if (isDean && !currentUser.department) {
        throw new Error('Dean must have an assigned department to view users');
      }

      const { users, error } = await getFullTimeUsers(
        currentUser.role,
        currentUser.department
      );

      if (error) throw new Error(error);

      // Additional client-side filtering
      const filteredUsers = users.filter(user => {
        // For Dean: Include own account and department's faculty/program chairs
        if (isDean) {
          return (
            // Include dean's own account
            (user._id === currentUser._id) ||
            // Include department members (faculty and program chairs)
            (user.department?._id &&
              user.department._id.toString() === currentUser.department.toString() &&
              ['Faculty', 'Program Chair'].includes(user.role))
          );
        }

        // For Admin: Include all non-admin users
        if (isAdmin) {
          return !['Administrator'].includes(user.role);
        }

        return true;
      });

      console.log(`Filtered to ${filteredUsers.length} available users for ${currentUser.role}`);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load available users: " + error.message,
        confirmButtonColor: "#4f46e5",
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
        const activeSlots = hours.slots
          .filter(slot => ["pending", "approved", "rejected", "cancelled"].includes(slot.status))
          .map(slot => ({
            ...slot,
            adminHoursId: hours._id
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setExistingSlots(activeSlots);
      } else {
        setExistingSlots([]);
      }
    } catch (error) {
      console.error("Error loading admin hours:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load existing admin hours",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  const handleAddSlot = () => {
    setSlots([...slots, { day: "", startTime: "", endTime: "" }])
  }

  const handleDeleteSlot = (index, isExisting = false) => {
    if (isExisting) {
      setExistingSlots(existingSlots.filter((_, i) => i !== index))
    } else {
      setSlots(slots.filter((_, i) => i !== index))
    }
  }

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots]
    newSlots[index] = { ...newSlots[index], [field]: value }

    if ((field === "startTime" || field === "endTime") && newSlots[index].startTime && newSlots[index].endTime) {
      const duration = calculateDuration(newSlots[index].startTime, newSlots[index].endTime)
      if (duration <= 0) {
        Swal.fire({
          icon: "error",
          title: "Invalid Time Range",
          text: "End time must be after start time",
          confirmButtonColor: "#4f46e5",
        })
        return
      }
    }

    setSlots(newSlots)
  }

  const handleEdit = (adminHoursId, slot) => {
    setEditingSlot({
      adminHoursId,
      slotId: slot._id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    setSlots([
      {
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    ]);
  };

  const handleRealTimeUpdate = (updatedRequest) => {
    const newSlots = updatedRequest.slots
      .filter(slot => ["pending", "approved", "rejected", "cancelled"].includes(slot.status))
      .map(slot => ({
        ...slot,
        adminHoursId: updatedRequest._id
      }));

    setExistingSlots(prev => {
      // Remove any slots that match the updated request's slots
      const existingFiltered = prev.filter(existing =>
        !newSlots.some(newSlot =>
          newSlot._id === existing._id ||
          newSlot.adminHoursId === existing.adminHoursId
        )
      );

      // Combine and sort all slots
      return [...newSlots, ...existingFiltered]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  };

  const handleSave = async () => {
    try {
      if (!validateTerm()) return;
      setIsLoading(true);

      if (editingSlot) {
        const response = await editAdminHours(
          editingSlot.adminHoursId,
          editingSlot.slotId,
          slots[0]
        );

        if (response.error) throw new Error(response.error);
      } else {
        if (!selectedUser) {
          throw new Error("Please select a user");
        }

        if (totalHours > maxHours) {
          throw new Error(`Total hours cannot exceed ${maxHours}`);
        }

        const invalidSlots = slots.filter((slot) => !slot.day || !slot.startTime || !slot.endTime);
        if (invalidSlots.length > 0) {
          throw new Error("Please fill in all time slot details");
        }

        const response = await saveAdminHours(selectedUser._id, termId, slots, currentUser._id, currentUser.role);
        if (response.error) throw new Error(response.error);

        // Update existing slots immediately with the new data
        if (response.hours) {
          const newSlots = response.hours.slots.map(slot => ({
            ...slot,
            adminHoursId: response.hours._id
          }));
          setExistingSlots(prev => {
            const existingFiltered = prev.filter(existing =>
              !newSlots.some(newSlot =>
                newSlot._id === existing._id
              )
            );
            return [...newSlots, ...existingFiltered]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          });
        }
      }

      // Clear the form
      setSlots([]);
      setEditingSlot(null);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: editingSlot ? "Admin hours updated successfully" : "Admin hours saved successfully",
        confirmButtonColor: "#4f46e5",
      });
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (adminHoursId, slotId) => {
    try {
      const result = await Swal.fire({
        title: "Cancel Request?",
        text: "Are you sure you want to cancel this admin hours request?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Yes, cancel it!",
        cancelButtonText: "No, keep it",
      })

      if (result.isConfirmed) {
        setIsLoading(true)
        const response = await cancelAdminHours(adminHoursId, slotId)

        if (response.error) {
          throw new Error(response.error)
        }

        // Only refresh and show success if no error
        await loadExistingHours()

        Swal.fire({
          icon: "success",
          title: "Cancelled!",
          text: response.message || "Admin hours request has been cancelled.",
          confirmButtonColor: "#4f46e5",
        })
      }
    } catch (error) {
      console.error("Error cancelling request:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to cancel admin hours request",
        confirmButtonColor: "#4f46e5",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserChange = (option) => {
    console.log("Selected user option:", option)
    setSelectedUser(option ? option.value : null)

    // Only reset the form fields, not the user selection
    if (!option) {
      resetForm(false)
    }
  }

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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all w-full max-w-6xl sm:my-8 flex flex-col md:flex-row">
                {/* Left sidebar */}
                <div className="bg-[#35408E] text-white p-8 md:w-80 flex flex-col">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto">
                    <ClockIcon className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>

                  <h2 className="text-2xl font-bold mb-4 text-center">Admin Hours</h2>

                  {/* Add role badge */}
                  <div className="mb-6 flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                      {isAdmin ? "Administrator" : isDean ? "Dean" : currentUser?.role || "Faculty"}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">INSTRUCTIONS</h3>

                      {/* Admin Instructions */}
                      {isAdmin && (
                        <ol className="space-y-4 text-sm">
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              1
                            </span>
                            <span>Select faculty member to review or assign hours</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              2
                            </span>
                            <span>Review pending admin hour requests</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              3
                            </span>
                            <span>Assign new admin hours for faculty members</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              4
                            </span>
                            <span>Approve or reject pending requests</span>
                          </li>
                        </ol>
                      )}

                      {/* Dean Instructions */}
                      {isDean && (
                        <ol className="space-y-4 text-sm">
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              1
                            </span>
                            <span>
                              {canSelectUser ? "Select yourself or faculty member" : "Review your term information"}
                            </span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              2
                            </span>
                            <span>Review existing admin hours</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              3
                            </span>
                            <span>Add new admin hours by day and time</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              4
                            </span>
                            <span>Save your changes (your hours are auto-approved)</span>
                          </li>
                        </ol>
                      )}

                      {/* Faculty/Program Chair Instructions */}
                      {!isAdmin && !isDean && (
                        <ol className="space-y-4 text-sm">
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              1
                            </span>
                            <span>Review your term information</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              2
                            </span>
                            <span>Review your submitted admin hours</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              3
                            </span>
                            <span>Add new admin hours by day and time</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                              4
                            </span>
                            <span>Submit for approval (pending hours can be edited)</span>
                          </li>
                        </ol>
                      )}
                    </div>

                    {termInfo && (
                      <div className="mt-auto pt-6">
                        <h4 className="text-sm font-medium text-indigo-200">Current Academic Year</h4>
                        <p className="text-lg font-semibold">{termInfo.academicYear}</p>

                        <h4 className="text-sm font-medium text-indigo-200 mt-3">Active Term</h4>
                        <p className="text-lg font-semibold">{termInfo.term}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 md:p-8 overflow-auto max-h-[80vh]">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                      Set Weekly Admin Hours
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      onClick={handleClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {isLoading ? (
                    <AdminHoursModalSkeleton />
                  ) : (
                    <>
                      {canSelectUser ? (
                        <Select
                          options={availableUsers.map((user) => ({
                            value: user,
                            label: `${user.lastName}, ${user.firstName}${user.department ? ` (${user.department.departmentCode})` : ""} - ${user.role}`,
                          }))}
                          onChange={handleUserChange}
                          value={
                            selectedUser
                              ? {
                                value: selectedUser,
                                label: `${selectedUser.lastName}, ${selectedUser.firstName}${selectedUser.department ? ` (${selectedUser.department.departmentCode})` : ""}`,
                              }
                              : null
                          }
                          isLoading={isLoading}
                          className="mb-4 text-black"
                          placeholder="Select user..."
                          noOptionsMessage={() => "No users available"}
                          styles={selectStyles}
                          isClearable
                        />
                      ) : (
                        <div className="mb-4 px-3 py-2 bg-gray-100 rounded text-black">
                          {currentUser.firstName} {currentUser.lastName} ({currentUser.role})
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Existing hours section - only shown for faculty/program chair */}
                        {!isAdmin && !isDean ? (
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div
                              className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                              onClick={() => setIsSubmittedHoursOpen(!isSubmittedHoursOpen)}
                            >
                              <h4 className="text-base font-semibold text-gray-900">View Submitted Admin Hours</h4>
                              <button className="text-gray-500 hover:text-gray-700">
                                {isSubmittedHoursOpen ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>

                            {isSubmittedHoursOpen && (
                              <div className="p-6">
                                {existingSlots.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Day
                                          </th>
                                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                          </th>
                                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                          </th>
                                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {existingSlots.map((slot, index) => (
                                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{slot.day}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                              {slot.startTime} - {slot.endTime}
                                            </td>
                                            <td className="px-4 py-3">
                                              <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${slot.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : slot.status === "rejected"
                                                      ? "bg-red-100 text-red-800"
                                                      : slot.status === "cancelled"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : slot.status === "deleted"
                                                          ? "bg-red-100 text-red-800"
                                                          : "bg-yellow-100 text-yellow-800"
                                                  }`}
                                              >
                                                {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center space-x-3">
                                                {slot.status === "pending" && (
                                                  <>
                                                    <button
                                                      onClick={() => handleEdit(slot.adminHoursId, slot)}
                                                      className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-indigo-50"
                                                    >
                                                      <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleCancelRequest(slot.adminHoursId, slot._id)}
                                                      className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-50"
                                                    >
                                                      <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                  </>
                                                )}
                                                {slot.status === "rejected" && (
                                                  <span className="text-sm text-red-600">
                                                    {slot.rejectionReason || "No reason provided"}
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
                                  <div className="text-center py-8">
                                    <p className="text-gray-500">No admin hours submitted yet.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Add new hours section - improved UI */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h4 className="text-base font-semibold text-gray-900">
                              {editingSlot ? "Edit Admin Hours" : "Add New Admin Hours"}
                            </h4>
                          </div>
                          <div className="p-6">
                            {slots.length > 0 ? (
                              <div className="relative">
                                <div className="overflow-x-auto">
                                  <table className="w-full table-fixed">
                                    <thead>
                                      <tr>
                                        <th className="w-[25%] px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Day
                                        </th>
                                        <th className="w-[25%] px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Start Time
                                        </th>
                                        <th className="w-[25%] px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          End Time
                                        </th>
                                        <th className="w-[15%] px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Duration
                                        </th>
                                        <th className="w-[10%] px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Action
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {slots.map((slot, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-4">
                                            <div className="relative">
                                              <Select
                                                options={DAYS}
                                                value={DAYS.find((d) => d.value === slot.day)}
                                                onChange={(option) => handleSlotChange(index, "day", option.value)}
                                                className="z-[60]"
                                                classNamePrefix="select"
                                                menuPlacement="auto"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                  ...selectStyles,
                                                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                  control: (base) => ({
                                                    ...base,
                                                    maxHeight: '42px',
                                                    background: '#fff'
                                                  })
                                                }}
                                              />
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <div className="relative">
                                              <Select
                                                options={TIME_OPTIONS}
                                                value={TIME_OPTIONS.find((t) => t.value === slot.startTime)}
                                                onChange={(option) => handleSlotChange(index, "startTime", option.value)}
                                                className="z-[60]"
                                                classNamePrefix="select"
                                                menuPlacement="auto"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                  ...selectStyles,
                                                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                  control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    background: '#fff'
                                                  })
                                                }}
                                              />
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <div className="relative">
                                              <Select
                                                options={TIME_OPTIONS}
                                                value={TIME_OPTIONS.find((t) => t.value === slot.endTime)}
                                                onChange={(option) => handleSlotChange(index, "endTime", option.value)}
                                                className="z-[60]"
                                                classNamePrefix="select"
                                                menuPlacement="auto"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                  ...selectStyles,
                                                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                  control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    background: '#fff'
                                                  })
                                                }}
                                              />
                                            </div>
                                          </td>
                                          <td className="p-4 text-sm font-medium text-gray-900">
                                            {slot.startTime && slot.endTime
                                              ? `${calculateDuration(slot.startTime, slot.endTime)} hrs`
                                              : "-"}
                                          </td>
                                          <td className="p-4 text-center">
                                            <button
                                              onClick={() => handleDeleteSlot(index)}
                                              className="inline-flex items-center p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                              title="Delete slot"
                                            >
                                              <TrashIcon className="h-5 w-5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No time slots</h3>
                                <p className="mt-1 text-sm text-gray-500">Add a new time slot to begin</p>
                                <div className="mt-6">
                                  <button
                                    type="button"
                                    onClick={handleAddSlot}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#35408E] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                  >
                                    <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Add New Row
                                  </button>
                                </div>
                              </div>
                            )}

                            {slots.length > 0 && (
                              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-6">
                                <button
                                  type="button"
                                  onClick={handleAddSlot}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                  Add Another Row
                                </button>
                                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg">
                                  <span className="text-sm font-medium text-indigo-700">Total Hours:</span>
                                  <span className="text-lg font-bold text-indigo-700">{totalHours}</span>
                                  <span className="text-sm text-indigo-500">/ {maxHours}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#35408E] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                          onClick={handleSave}
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : editingSlot ? "Update" : isDean || isAdmin ? "Save" : "Submit for Approval"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
