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

interface CollectionEntry {
  date: string
  amount: string
}

const CollectionPerformanceChart: React.FC = () => {
  const [isDark, setIsDark] = useState(false)
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(matchMedia.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    matchMedia.addEventListener('change', handler)
    return () => matchMedia.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/collections/daily')
        const json: CollectionEntry[] = await res.json()

        const labels = json.map((entry) => entry.date)
        const amounts = json.map((entry) => Number(entry.amount) / 1_000_000)

        setChartData({
          labels,
          datasets: [
            {
              label: 'Amount Collected (Juta Rupiah)',
              data: amounts,
              backgroundColor: 'rgba(34,197,94,0.7)', // Tailwind green-500
              borderRadius: 8,
              barThickness: 20,
              categoryPercentage: 0.6,
              barPercentage: 0.8,
            },
          ],
        })
      } catch (err) {
        console.error('❌ Failed to fetch chart data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 12 },
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const raw = context.raw as number
            return `Rp ${(raw * 1_000_000).toLocaleString('id-ID')}`
          },
        },
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#f9fafb' : '#111827',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Juta Rupiah',
          font: { size: 12 },
          color: isDark ? '#e5e7eb' : '#374151',
        },
        ticks: {
          font: { size: 10 },
          color: isDark ? '#d1d5db' : '#4b5563',
        },
        grid: {
          color: isDark ? 'rgba(229, 231, 235, 0.05)' : 'rgba(156, 163, 175, 0.15)',
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
          color: isDark ? '#d1d5db' : '#4b5563',
          autoSkip: false,
          maxRotation: 45,
          minRotation: 30,
        },
        grid: {
          color: isDark ? 'rgba(229, 231, 235, 0.05)' : 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        📊 Collection Performance (Daily)
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-[250px]">
          <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="h-[300px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  )
}

export default CollectionPerformanceChart
