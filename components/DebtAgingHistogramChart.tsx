'use client'

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
  TooltipItem,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface AgingData {
  label: string
  amount: number
}

const DebtAgingHistogramChart: React.FC = () => {
  const [data, setData] = useState<AgingData[]>([])
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/debtors/aging')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('❌ Error fetching aging data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(matchMedia.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    matchMedia.addEventListener('change', handler)
    return () => matchMedia.removeEventListener('change', handler)
  }, [])

  const chartData: ChartData<'bar'> = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: 'Outstanding (Juta Rupiah)',
        data: data.map((item) => item.amount / 1_000_000),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        barThickness: 30,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#f3f4f6' : '#374151',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#f9fafb' : '#111827',
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const raw = context.raw as number
            return `Rp ${(raw * 1_000_000).toLocaleString('id-ID')}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Juta Rupiah',
          color: isDark ? '#e5e7eb' : '#374151',
          font: { size: 12 },
        },
        ticks: {
          color: isDark ? '#d1d5db' : '#4b5563',
          font: { size: 11 },
        },
        grid: {
          color: isDark ? 'rgba(229,231,235,0.1)' : 'rgba(156,163,175,0.15)',
        },
      },
      x: {
        ticks: {
          color: isDark ? '#d1d5db' : '#4b5563',
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        📊 Debt Aging Distribution
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : data.length > 0 ? (
        <div className="w-full overflow-x-auto" style={{ height: 320 }}>
          <Bar data={chartData} options={options} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
      )}
    </div>
  )
}

export default DebtAgingHistogramChart
