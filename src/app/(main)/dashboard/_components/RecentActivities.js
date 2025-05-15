"use client"

import { motion } from "framer-motion"
import { Activity, Clock, Filter, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getRecentActivities } from "../_actions"
import useAuthStore from "@/store/useAuthStore"
import PusherClient from 'pusher-js'

export default function RecentActivities() {  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [selectedActivity, setSelectedActivity] = useState(null)
  const { user } = useAuthStore()

  // Get appropriate title based on user role
  const getActivityTitle = () => {
    if (user?.role === 'Program Chair') {
      return 'Course Schedule Activities'
    } else if (user?.role === 'Dean') {
      return 'Department Schedule Activities'
    }
    return 'Recent Activities'
  }

  const fetchActivities = async () => {
    try {
      const data = await getRecentActivities(user?.role, {
        department: user?.department,
        course: user?.course
      })
      setActivities(data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()

    // Initialize Pusher
    const pusher = new PusherClient('74f2d50d18d447032f41', {
      cluster: 'ap1'
    })

    // Subscribe to the appropriate channel based on user role
    const channelName = user?.role === 'Dean' ? `schedule-activities-${user.department}` : 'activities'
    const channel = pusher.subscribe(channelName)

    // Handle different types of updates
    const handlers = {
      'schedule-update': (newActivity) => {
        setActivities(prev => {
          // Add the new activity at the beginning of the list
          const updated = [newActivity, ...prev]
          // If we're a Dean, filter out non-schedule activities
          if (user?.role === 'Dean') {
            return updated.filter(activity => activity.type === 'schedule')
          }
          return updated
        })
      },
      'activity-update': (newActivity) => {
        if (user?.role !== 'Dean') {
          setActivities(prev => [newActivity, ...prev])
        }
      }
    }

    // Bind event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      channel.bind(event, handler)
    })

    // Cleanup function
    return () => {
      Object.keys(handlers).forEach(event => {
        channel.unbind(event)
      })
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [user])

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

  const handleDetailsClick = (activity) => {
    setSelectedActivity(activity)
  }

  const closeModal = () => {
    setSelectedActivity(null)
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors h-[420px]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">          <div className="flex items-center gap-2">            <Activity className="h-5 w-5 text-violet-500 dark:text-violet-400" />            <h3 className="font-medium text-gray-900 dark:text-white">
              {getActivityTitle()}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/activity-logs/archive')}
              className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              View All
            </button>
          </div>
        </div>

        <div className="p-4 h-[calc(400px-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                  <button 
                    onClick={() => handleDetailsClick(activity)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Details
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Details</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[selectedActivity.status]}`} />
                <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {selectedActivity.status}
                </span>
              </div>

              {/* Action */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</h4>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedActivity.action}</p>
              </div>

              {/* User */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performed By</h4>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedActivity.user}</p>
              </div>

              {/* Timestamp */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</h4>
                <div className="mt-1 flex items-center text-gray-900 dark:text-white">
                  <Clock className="h-4 w-4 mr-1.5" />
                  {selectedActivity.time}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
