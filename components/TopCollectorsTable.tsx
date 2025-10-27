'use client'

import React, { useEffect, useState } from 'react'

interface Collector {
  collectorId: string
  name: string
  email: string
  totalCollected: number
  totalDebtors: number
}

const TopCollectorsTable: React.FC = () => {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopCollectors = async () => {
      try {
        const res = await fetch('/api/collectors/top')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setCollectors(json.data)
        } else {
          console.error('Invalid response structure:', json)
        }
      } catch (err) {
        console.error('❌ Error fetching top collectors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopCollectors()
  }, [])

  const formatCurrency = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-8 overflow-x-auto">
      <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
        Top Performing Collectors
      </h3>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : collectors.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      ) : (
        <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Amount Collected</th>
              <th className="px-4 py-2">Debtor Count</th>
            </tr>
          </thead>
          <tbody>
            {collectors.map((c, index) => (
              <tr
                key={c.collectorId}
                className="border-b border-gray-200 dark:border-gray-600"
              >
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2 text-green-600">
                  {formatCurrency(c.totalCollected)}
                </td>
                <td className="px-4 py-2">{c.totalDebtors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TopCollectorsTable
