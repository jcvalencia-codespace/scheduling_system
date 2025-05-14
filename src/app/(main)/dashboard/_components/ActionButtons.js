"use client"

import { motion } from "framer-motion"
import { BookOpen, Home, Users, Calendar, Layers } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ActionButtons() {
  const router = useRouter()

  const buttons = [
    {
      label: "Create new Section",
      icon: <BookOpen className="h-5 w-5" />,
      color: "rose",
      href: "entry/sections"
    },
    {
      label: "Register Room",
      icon: <Home className="h-5 w-5" />,
      color: "sky",
      href: "entry/rooms/new"
    },
    {
      label: "Add Faculty Member",
      icon: <Users className="h-5 w-5" />,
      color: "amber",
      href: "entry/users/new"
    },
    {
      label: "Schedule Class",
      icon: <Calendar className="h-5 w-5" />,
      color: "emerald",
      href: "entry/schedules"
    },
    {
      label: "Subject Management",
      icon: <Layers className="h-5 w-5" />,
      color: "violet",
      href: "entry/subjects"
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
      {buttons.map((button, index) => (
        <ActionButton 
          key={index}
          {...button}
          variants={item}
          onClick={() => router.push(button.href)}
        />
      ))}
    </motion.div>
  )
}

const colors = {
  rose: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    hover: "hover:bg-rose-200 dark:hover:bg-rose-900/40",
    text: "text-rose-700 dark:text-rose-300",
  },
  sky: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    hover: "hover:bg-blue-200 dark:hover:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  amber: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  emerald: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    hover: "hover:bg-cyan-200 dark:hover:bg-cyan-900/40",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  violet: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    hover: "hover:bg-purple-200 dark:hover:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
  },
}

function ActionButton({ label, icon, color, variants, onClick }) {
  const colorClasses = colors[color]

  return (
    <motion.button
      variants={variants}
      onClick={onClick}
      className={`${colorClasses.bg} ${colorClasses.hover} ${colorClasses.text} rounded-lg p-3 text-sm font-medium transition-colors flex items-center gap-2`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}
