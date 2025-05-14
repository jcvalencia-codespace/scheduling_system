"use client"

import { useState, useEffect } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useTheme } from "next-themes"
import { BarChart3, PieChart } from "lucide-react"

export default function RoomList({ chartType, title }) {
  const { theme } = useTheme()
  const [chartTheme, setChartTheme] = useState("light")

  useEffect(() => {
    setChartTheme(theme === "dark" ? "dark" : "light")
  }, [theme])

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

  // Registered Rooms - Horizontal Bar Chart
  const registeredRoomsOptions = {
    chart: {
      type: "bar",
      height: 180,
      backgroundColor: "transparent",
      spacingBottom: 2,
      spacingTop: 2,
      spacingRight: 15,
      spacingLeft: 5,
      inverted: true, // Make bars horizontal
    },
    title: {
      text: title || "Registered Rooms",
      align: "left",
      style: { fontSize: '14px', fontWeight: "600" },
    },
    xAxis: {
      categories: ["No.29", "STH4", "SEA", "TBA"],
      title: { text: null },
      labels: { style: { fontSize: '11px' } }
    },
    yAxis: {
      min: 0,
      max: 100,
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
      data: [77, 65, 35, 25],
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
  }

  // Room Usage Frequency - Column Chart
  const usageFrequencyOptions = {
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
      text: title || "Room Usage Frequency",
      align: "left",
      style: { fontSize: '14px', fontWeight: "600" },
    },
    xAxis: {
      categories: ["202", "203", "304", "305", "306"],
      crosshair: true,
      labels: { style: { fontSize: '11px' } }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: null },
      gridLineWidth: 1,
      gridLineDashStyle: 'dash',
      labels: { 
        style: { fontSize: '10px' },
        format: '{value}%'
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
        name: "Freq. Occupied",
        data: [80, 75, 65, 60, 45],
        color: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, '#60a5fa'],
            [1, '#93c5fd']
          ]
        },
      },
      {
        name: "Least Occupied",
        data: [45, 50, 40, 35, 30],
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
  }

  const chartOptions = chartType === "bar" ? registeredRoomsOptions : usageFrequencyOptions
  const icon =
    chartType === "bar" ? (
      <BarChart3 className="h-5 w-5 text-violet-500 dark:text-violet-400" />
    ) : (
      <PieChart className="h-5 w-5 text-blue-500 dark:text-blue-400" />
    )

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
