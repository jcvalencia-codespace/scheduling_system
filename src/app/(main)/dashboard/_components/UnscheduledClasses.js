"use client"

import { motion } from "framer-motion"

export default function UnscheduledClasses() {
  const classes = [
    { id: 1, code: "BSIT - ITE 211" },
    { id: 2, code: "BSIT - ITE 211" },
    { id: 3, code: "BSIT - ITE 211" },
    { id: 4, code: "BSIT - ITE 211" },
    { id: 5, code: "BSIT - ITE 211" },
    { id: 6, code: "BSIT - ITE 211" },
    { id: 7, code: "BSIT - ITE 211" },
    { id: 8, code: "BSIT - ITE 211" },
    { id: 9, code: "BSIT - ITE 211" },
    { id: 10, code: "BSIT - ITE 211" },
    { id: 11, code: "BSIT - ITE 211" },
    { id: 12, code: "BSIT - ITE 211" },
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm h-[720px] transition-colors">
      <div className="p-4 border-b border-blue-200/70 dark:border-blue-800/30">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Classes with no Schedules</h3>
      </div>

      <div className="p-4 h-[calc(720px-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-800 scrollbar-track-transparent">
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
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Create Schedule
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
