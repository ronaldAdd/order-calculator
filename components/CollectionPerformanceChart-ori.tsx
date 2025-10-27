import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const labels: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const baseData: ChartData<'bar'> = {
  labels,
  datasets: [
    {
      label: 'Target',
      data: [30, 45, 50, 60, 55, 65, 70, 80, 85, 90, 100, 110],
      backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue
    },
    {
      label: 'Actual',
      data: [25, 42, 48, 50, 52, 60, 68, 78, 80, 88, 95, 100],
      backgroundColor: 'rgba(16, 185, 129, 0.6)', // green
    },
  ],
}

const CollectionPerformanceChart: React.FC = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(matchMedia.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    matchMedia.addEventListener('change', handler)
    return () => matchMedia.removeEventListener('change', handler)
  }, [])

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 },
          color: isDark ? '#e5e7eb' : '#374151', // light gray / dark gray
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#f9fafb' : '#111827',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Million IDR',
          font: { size: 12 },
          color: isDark ? '#e5e7eb' : '#374151',
        },
        ticks: {
          font: { size: 10 },
          color: isDark ? '#d1d5db' : '#4b5563',
        },
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(229, 231, 235, 0.1)' : 'rgba(156, 163, 175, 0.2)', // grid line
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
          color: isDark ? '#d1d5db' : '#4b5563',
        },
        grid: {
          color: isDark ? 'rgba(229, 231, 235, 0.1)' : 'rgba(156, 163, 175, 0.2)',
        },
      },
    },
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-8"
      style={{ height: 300 }}
    >
      <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
        Collection Performance (Target vs Actual)
      </h3>
      <Bar data={baseData} options={options} />
    </div>
  )
}

export default CollectionPerformanceChart
