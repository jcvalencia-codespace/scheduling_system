"use client"

import { motion } from "framer-motion"
import { Activity, Clock, Filter } from "lucide-react"

export default function RecentActivities() {
  const activities = [
    {
      id: 1,
      action: "Added a new faculty member",
      user: "John Smith",
      time: "1 hour ago",
      status: "success",
    },
    {
      id: 2,
      action: "Updated room 304 availability",
      user: "Maria Garcia",
      time: "2 hours ago",
      status: "success",
    },
    {
      id: 3,
      action: "Scheduled BSIT-ITE211 class",
      user: "Robert Johnson",
      time: "3 hours ago",
      status: "success",
    },
    {
      id: 4,
      action: "Failed to update faculty schedule",
      user: "Emily Davis",
      time: "4 hours ago",
      status: "error",
    },
    {
      id: 5,
      action: "Created new section for BSCS",
      user: "Michael Wilson",
      time: "5 hours ago",
      status: "success",
    },
    {
      id: 6,
      action: "Generated term report",
      user: "Sarah Thompson",
      time: "6 hours ago",
      status: "warning",
    },
    {
      id: 7,
      action: "Generated term report",
      user: "Sarah Thompson",
      time: "6 hours ago",
      status: "warning",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  const statusColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors h-[420px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-500 dark:text-violet-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Recent Activities</h3>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
          <button className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
            View All
          </button>
        </div>
      </div>

      <div className="p-4 h-[calc(400px-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {activities.map((activity) => (
            <motion.div key={activity.id} variants={item} className="flex items-start gap-3 group">
              <div className={`w-2 h-2 mt-1.5 rounded-full ${statusColors[activity.status]}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{activity.user}</span>
                  <span className="inline-block h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                Details
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
