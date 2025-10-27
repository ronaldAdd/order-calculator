'use client'

import React, { useEffect, useState } from 'react'
import { FaMedal } from 'react-icons/fa'

interface Collector {
  collectorId: string
  name: string
  email: string
  totalCollected: number
  totalDebtors: number
}

const TopPerformingCollectors: React.FC = () => {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const res = await fetch('/api/collectors/top')
        const json = await res.json()

        if (json.success && Array.isArray(json.data)) {
          setCollectors(json.data)
        } else {
          console.error('❌ Unexpected response format:', json)
        }
      } catch (err) {
        console.error('❌ Error fetching top collectors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectors()
  }, [])

  const formatCurrency = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`

  const getMedalColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'
    if (rank === 1) return 'text-gray-400'
    if (rank === 2) return 'text-amber-700'
    return ''
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        🌟 Top Performing Collectors
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : collectors.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Amount Collected</th>
                <th className="px-4 py-3 text-center">Debtors</th>
              </tr>
            </thead>
            <tbody>
              {collectors.map((collector, index) => (
                <tr
                  key={collector.collectorId}
                  className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    {index < 3 ? (
                      <FaMedal className={`text-base ${getMedalColor(index)}`} />
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{collector.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{collector.email}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {formatCurrency(collector.totalCollected)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {collector.totalDebtors}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TopPerformingCollectors
