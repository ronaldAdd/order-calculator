'use client'

import React, { useEffect, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import ReactSelect, { SingleValue } from 'react-select'
import reactSelectStyles from '@/lib/reactSelectStyles'
import {
  productNameOptions,
} from '@/constants/formOptions'

ChartJS.register(ArcElement, Tooltip, Legend)

type ChartData = {
  labels: string[]
  values: number[]
}

type OptionType = {
  label: string
  value: string
}

const PortfolioStatusChart: React.FC = () => {
  const [data, setData] = useState<ChartData>({ labels: [], values: [] })
  // const [products, setProducts] = useState<OptionType[]>([])
  const [selectedProduct, setSelectedProduct] = useState<OptionType | null>(productNameOptions[0])
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(match.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    match.addEventListener('change', handler)
    return () => match.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedProduct) {
        setData({ labels: [], values: [] })
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/portfolio-status?productName=${selectedProduct.value}`)
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        const result: ChartData = await res.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching chart data:', err)
        setData({ labels: [], values: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [selectedProduct])


  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Debtors',
        data: data.values,
        backgroundColor: [
          '#3b82f6', // blue-500
          '#10b981', // green-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#8b5cf6', // purple-500
          '#ec4899', // pink-500
        ],
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#f9fafb' : '#111827',
      },
    },
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        📈 Portfolio Status by Product
      </h3>

      <div className="mb-4 w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filter by Product
        </label>
        {/* ReactSelect */}
          <ReactSelect
            options={productNameOptions}
            value={selectedProduct}
            onChange={(option) => {
              if (!Array.isArray(option)) {
                const single = option as SingleValue<OptionType>
                setSelectedProduct(single)
              }
            }}
            styles={reactSelectStyles}
            isClearable
            placeholder="Select product"
          />        
      </div>

      <div className="w-full max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : data.labels.length > 0 ? (
          <Pie data={chartData} options={options} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No data available
          </p>
        )}
      </div>
    </div>
  )
}

export default PortfolioStatusChart
