"use client"

import { useState, useEffect, useMemo } from "react"
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline"
import { getUsers, removeUser } from "./_actions"
import AddEditUserModal from "./_components/AddEditUserModal"
import { useLoading } from "../../../context/LoadingContext"
import NoData from "@/app/components/NoData"
import Swal from "sweetalert2"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const { isLoading, setIsLoading } = useLoading()
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({
    key: "lastName",
    direction: "asc",
  })
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const usersData = await getUsers()
      if (usersData.error) {
        throw new Error(usersData.error)
      }
      setUsers(usersData.users || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load users",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return users

    return [...users].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [users, sortConfig])

  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    })

    if (result.isConfirmed) {
      try {
        const response = await removeUser(userId)
        if (response.success) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "User has been deleted successfully.",
            confirmButtonColor: "#3b82f6",
          })
          fetchUsers()
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.error || "Failed to delete user",
            confirmButtonColor: "#3b82f6",
          })
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete user",
          confirmButtonColor: "#3b82f6",
        })
      }
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleAddNew = () => {
    setSelectedUser(null)
    setShowModal(true)
  }

  const formatEmploymentType = (type) => {
    return type === "full-time" ? "Full-Time" : "Part-Time"
  }

  const filteredUsers = sortedUsers.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-700" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-700" />
    )
  }

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: "bg-red-100 text-red-800",
      teacher: "bg-blue-100 text-blue-800",
      student: "bg-green-100 text-green-800",
      staff: "bg-amber-100 text-amber-800",
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role.toLowerCase()] || "bg-gray-100 text-gray-800"}`}
      >
        {role}
      </span>
    )
  }

  const renderPageNumbers = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // First page
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          1
        </button>,
      )

      // Ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push(
          <span
            key="ellipsis1"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
          >
            ...
          </span>,
        )
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
            currentPage === i ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "text-gray-700 hover:bg-gray-50"
          } focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          {i}
        </button>,
      )
    }

    // Last page
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span
            key="ellipsis2"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
          >
            ...
          </span>,
        )
      }

      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {totalPages}
        </button>,
      )
    }

    return pageNumbers
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="mt-1 text-sm text-gray-500">
                A list of all users in the system including their details and roles.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                placeholder="Search users..."
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <div className="min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-3/4 sm:w-auto py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    <button onClick={() => handleSort("lastName")} className="group inline-flex items-center">
                      Name
                      {getSortIcon("lastName")}
                    </button>
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button onClick={() => handleSort("email")} className="group inline-flex items-center">
                      Email
                      {getSortIcon("email")}
                    </button>
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button onClick={() => handleSort("role")} className="group inline-flex items-center">
                      Role
                      {getSortIcon("role")}
                    </button>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button onClick={() => handleSort("department")} className="group inline-flex items-center">
                      Department
                      {getSortIcon("department")}
                    </button>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button onClick={() => handleSort("course")} className="group inline-flex items-center">
                      Course
                      {getSortIcon("course")}
                    </button>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button onClick={() => handleSort("employmentType")} className="group inline-flex items-center">
                      Type
                      {getSortIcon("employmentType")}
                    </button>
                  </th>
                  <th scope="col" className="w-1/4 sm:w-20 py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <NoData
                        message={searchTerm ? "No matching users" : "No users yet"}
                        description={searchTerm ? "Try adjusting your search term" : "Add a user to get started"}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="w-3/4 sm:w-auto py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900 truncate">
                          {user.firstName} {user.middleName} {user.lastName}
                        </div>
                        <div className="mt-1 sm:hidden text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="mt-1 sm:hidden">
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="mt-1 sm:hidden text-gray-500 text-xs">
                          {user.department?.departmentCode || "-"} • {user.course?.courseCode || "-"} • {formatEmploymentType(user.employmentType)}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm">{getRoleBadge(user.role)}</td>
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.department?.departmentCode || "-"}
                      </td>
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.course?.courseCode || "-"}
                      </td>
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatEmploymentType(user.employmentType)}
                      </td>
                      <td className="w-1/4 sm:w-20 py-4 pl-3 pr-4 sm:pr-6">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 p-1 sm:p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-900 p-1 sm:p-1.5 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 flex-wrap gap-4">
            <div className="flex-1 text-sm text-gray-700 min-w-full sm:min-w-0">
              <p>
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{" "}
                <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Previous
              </button>
              <div className="hidden sm:flex -space-x-px">
                {renderPageNumbers()}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AddEditUserModal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={() => {
          setShowModal(false)
          setSelectedUser(null)
          fetchUsers()
        }}
      />
    </div>
  )
}
