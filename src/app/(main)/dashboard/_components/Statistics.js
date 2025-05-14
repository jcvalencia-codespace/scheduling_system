"use client"

import { Activity, BookOpen, Calendar, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getDashboardStats } from "../_actions"

export default function Statistics({ type }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats()
        setData(stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = {
    term: {
      title: "Term Active",
      value: data?.term || "...",
      icon: <Calendar className="h-5 w-5" />,
      color: "emerald",
    },
    schedules: {
      title: "Schedules",
      value: data?.schedules || "...",
      icon: <Activity className="h-5 w-5" />,
      color: "blue",
    },
    subjects: {
      title: "Subjects",
      value: data?.subjects || "...",
      icon: <BookOpen className="h-5 w-5" />,
      color: "cyan",
    },
    faculties: {
      title: "Faculties",
      value: data?.faculty || "...",
      icon: <Users className="h-5 w-5" />,
      color: "violet",
    },
  }

  const statData = stats[type] || stats.term

  return <StatCard {...statData} />
}

const colors = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-200",
    border: "border-emerald-100 dark:border-emerald-800/50",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200",
    border: "border-blue-100 dark:border-blue-800/50",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: "bg-cyan-100 dark:bg-cyan-800 text-cyan-600 dark:text-cyan-200",
    border: "border-cyan-100 dark:border-cyan-800/50",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-700 dark:text-violet-300",
    icon: "bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-200",
    border: "border-violet-100 dark:border-violet-800/50",
  },
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = colors[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${colorClasses.bg} rounded-lg border ${colorClasses.border} p-4 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center text-center h-32`}
    >
      <div className={`rounded-full ${colorClasses.icon} p-2 mb-2`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses.text} mt-1`}>{value}</p>
    </motion.div>
  )
}
