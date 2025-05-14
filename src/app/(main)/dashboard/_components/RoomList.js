"use client"

import { useState, useEffect } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useTheme } from "next-themes"
import { BarChart3, PieChart } from "lucide-react"
import { getRoomStatistics } from "../_actions"

export default function RoomList({ chartType, title }) {
  const { theme } = useTheme()
  const [chartTheme, setChartTheme] = useState("light")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setChartTheme(theme === "dark" ? "dark" : "light")
  }, [theme])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getRoomStatistics()
        setData(stats)
      } catch (error) {
        console.error('Error fetching room statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getChartOptions = (isDark) => {
    const textColor = isDark ? "#e5e7eb" : "#374151"
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
    const backgroundColor = "transparent"

    return {
      chart: {
        backgroundColor,
        style: {
          fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        },
      },
      title: {
        style: {
          color: textColor,
        },
      },
      subtitle: {
        style: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
      },
      xAxis: {
        labels: {
          style: {
            color: textColor,
          },
        },
        gridLineColor: gridColor,
        lineColor: gridColor,
        tickColor: gridColor,
      },
      yAxis: {
        labels: {
          style: {
            color: textColor,
          },
        },
        gridLineColor: gridColor,
      },
      legend: {
        itemStyle: {
          color: textColor,
        },
        itemHoverStyle: {
          color: isDark ? "#fff" : "#000",
        },
      },
      plotOptions: {
        series: {
          borderRadius: 6,
        },
      },
    }
  }

  const getRegisteredRoomsOptions = () => ({
    chart: {
      type: "bar",
      height: 180,
      backgroundColor: "transparent",
      spacingBottom: 2,
      spacingTop: 2,
      spacingRight: 15,
      spacingLeft: 5,
      inverted: true,
    },
    title: {
      text: title || "Registered Rooms",
      align: "left",
      style: { fontSize: '14px', fontWeight: "600" },
    },
    xAxis: {
      categories: data?.registeredRooms.map(r => r.department) || [],
      title: { text: null },
      labels: { 
        style: { fontSize: '11px' },
        rotation: -45,
        align: 'right'
      }
    },
    yAxis: {
      min: 0,
      title: { text: null },
      gridLineWidth: 0,
      labels: { enabled: false }
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          align: 'right',
          style: { fontSize: '11px' }
        }
      }
    },
    series: [{
      name: "Rooms",
      data: data?.registeredRooms.map(r => r.count) || [],
      color: {
        linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
        stops: [
          [0, '#8b5cf6'],
          [1, '#a78bfa']
        ]
      },
    }],
    legend: { enabled: false },
    credits: { enabled: false }
  })

  const getUsageFrequencyOptions = () => ({
    chart: {
      type: "column",
      height: 180,
      backgroundColor: "transparent",
      spacingBottom: 2,
      spacingTop: 2,
      spacingRight: 5,
      spacingLeft: 5,
    },
    title: {
      text: title || "Room Schedule Frequency",
      align: "left",
      style: { fontSize: '14px', fontWeight: "600" },
    },
    xAxis: {
      categories: data?.usageFrequency.map(r => r.roomCode) || [],
      crosshair: true,
      labels: { style: { fontSize: '11px' } }
    },
    yAxis: {
      min: 0,
      title: { text: 'Number of Schedules' },
      gridLineWidth: 1,
      gridLineDashStyle: 'dash',
      labels: { 
        style: { fontSize: '10px' }
      }
    },
    plotOptions: {
      column: {
        groupPadding: 0.1,
        pointPadding: 0.05,
        borderRadius: 3
      }
    },
    series: [
      {
        name: "Most Scheduled",
        data: data?.usageFrequency.map(r => r.mostScheduled) || [],
        color: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, '#60a5fa'],
            [1, '#93c5fd']
          ]
        },
      },
      {
        name: "Least Scheduled",
        data: data?.usageFrequency.map(r => r.leastScheduled) || [],
        color: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, '#f87171'],
            [1, '#fca5a5']
          ]
        },
      }
    ],
    legend: {
      align: 'right',
      verticalAlign: 'top',
      symbolRadius: 2,
      itemStyle: { fontSize: '10px', fontWeight: 'normal' },
      itemDistance: 10
    },
    credits: { enabled: false }
  })

  const chartOptions = chartType === "bar" ? getRegisteredRoomsOptions() : getUsageFrequencyOptions()
  const icon =
    chartType === "bar" ? (
      <BarChart3 className="h-5 w-5 text-violet-500 dark:text-violet-400" />
    ) : (
      <PieChart className="h-5 w-5 text-blue-500 dark:text-blue-400" />
    )

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors p-4">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  )
}
