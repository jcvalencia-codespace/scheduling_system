"use client"

import { useMemo, useState, useEffect } from "react"
import moment from "moment"
import { ScheduleHistorySkeleton } from "./Skeleton"
import Pagination from "./Pagination"
import {
  CalendarIcon,
  ClockIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  TrashIcon,
  UserIcon,
  BookOpenIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline"

export default function ScheduleHistoryTable({ history, isLoading, currentUser }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Reset to page 1 when history changes
  useEffect(() => {
    setCurrentPage(1)
  }, [history])

  const filteredHistory = useMemo(() => {
    if (!history) return []
    return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [history])

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredHistory, currentPage])

  // Function to determine action badge color
  const getActionBadgeColor = (action) => {
    switch (action.toLowerCase()) {
      case "created":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "updated":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "deleted":
        return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
      default:
        return "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
    }
  }

  // Function to get action icon
  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case "created":
        return <DocumentPlusIcon className="w-3.5 h-3.5" />
      case "updated":
        return <DocumentTextIcon className="w-3.5 h-3.5" />
      case "deleted":
        return <TrashIcon className="w-3.5 h-3.5" />
      default:
        return <DocumentTextIcon className="w-3.5 h-3.5" />
    }
  }

  // Format relative time with fallback to standard format
  const formatDate = (date) => {
    const momentDate = moment(date)
    const now = moment()

    if (now.diff(momentDate, "days") < 7) {
      return momentDate.fromNow()
    }

    return momentDate.format("MMM DD, YYYY")
  }

  // Format time separately
  const formatTime = (date) => {
    return moment(date).format("h:mm A")
  }

  if (isLoading) return <ScheduleHistorySkeleton />

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Schedule Details
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Updated By
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No history found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Schedule changes will appear here when they occur.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((entry) => (
                  <tr key={entry._id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="whitespace-nowrap px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getActionBadgeColor(entry.action)}`}
                      >
                        {getActionIcon(entry.action)}
                        {entry.action}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <BookOpenIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">{entry.scheduleDetails.subject.code}</span> -{" "}
                            {entry.scheduleDetails.subject.name}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <UserIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.scheduleDetails.faculty.name}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <UserGroupIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.scheduleDetails.sections.map((s) => s.name).join(", ")}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <BuildingOfficeIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.scheduleDetails.department?.name || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CalendarDaysIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.scheduleDetails.term || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.updatedBy.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(entry.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(entry.updatedAt)}
                          </span>
                        </div>
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
      {filteredHistory.length > 0 && (
        <Pagination
          totalItems={filteredHistory.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  )
}