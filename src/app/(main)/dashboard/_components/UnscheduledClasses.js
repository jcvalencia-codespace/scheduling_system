"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUnscheduledSections } from "../_actions"
import useAuthStore from "@/store/useAuthStore"

export default function UnscheduledClasses() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUnscheduledSections(
          user?.role,
          { 
            department: user?.department,
            course: user?.course // Make sure course ID is passed
          }
        )
        console.log('Fetched unscheduled sections:', data.length) // Add debug log
        setClasses(data)
      } catch (error) {
        console.error('Error fetching unscheduled classes:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user) {
      fetchData()
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm h-[720px] transition-colors">
      <div className="p-4 border-b border-blue-200/70 dark:border-blue-800/30">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Classes with no Schedules ({classes.length})
        </h3>
      </div>

      <div className="p-4 h-[calc(720px-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-800 scrollbar-track-transparent">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-14 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/30" />
              </div>
            ))}
          </div>
        ) : classes.length > 0 ? (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {classes.map((cls) => (
              <motion.div
                key={cls.id}
                variants={item}
                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 dark:text-blue-400">📚</span>
                  <span className="text-gray-900 dark:text-gray-200">{cls.code}</span>
                </div>
                <button 
                  onClick={() => router.push(`/schedules?section=${encodeURIComponent(cls.code.split(' - ')[1])}`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Create Schedule
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">All classes have been scheduled</p>
          </div>
        )}
      </div>
    </div>
  )
}
