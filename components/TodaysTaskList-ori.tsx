'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import useUserStore from '../src/store/useUserStore'
import { FiPhone, FiEye  } from 'react-icons/fi'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Debtor {
  id: number
  firstName?: string
  lastName?: string
  outstandingAmount?: number | string
  nextFollowUpDate?: string
  status?: string
  forecast?: string
  User?: User
}

const TodaysTaskList: React.FC = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    const fetchDebtors = async () => {
      try {
        const res = await fetch('/api/debtors/promises-today')
        if (!res.ok) throw new Error('API request failed')
        const json = await res.json()
        setDebtors(json.data || [])
      } catch (error) {
        console.error('Failed to fetch debtors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDebtors()
  }, [])

  const formatCurrency = (amount: number | string = 0) =>
    `Rp ${Number(amount).toLocaleString('id-ID')}`

  const getPriorityBadge = (forecast?: string) => {
    const isHigh = forecast?.toLowerCase() === 'high'
    return isHigh ? (
      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">High</span>
    ) : (
      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
        {forecast || 'Normal'}
      </span>
    )
  }

  const getFullName = (debtor: Debtor) =>
    `${debtor.firstName ?? ''} ${debtor.lastName ?? ''}`.trim()

  const getDebtorHref = (id: number) => {
    if (user?.role === 'admin') return `/admin/debtors/view/${id}`
    return `/collector/debtors/view/${id}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        📅 Today&apos;s Task List
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : debtors.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No follow-ups due today 🎉
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Debtor</th>
                <th className="px-4 py-3">Assigned Collector</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-center">Forecast</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((debtor) => (
                <tr
                  key={debtor.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={getDebtorHref(debtor.id)}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {getFullName(debtor)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {debtor.User?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700 dark:text-green-400">
                    {formatCurrency(debtor.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getPriorityBadge(debtor.forecast)}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={getDebtorHref(debtor.id)}
                      className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded inline-flex items-center justify-center"
                    >
                      <FiEye />
                    </Link>
                    <button
                      className="text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded"
                    >
                      <FiPhone />
                    </button>
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

export default TodaysTaskList
