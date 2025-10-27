'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import useUserStore from '../src/store/useUserStore'
import { FiPhone, FiEye } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
  mobilePhones?: string // JSON string: '["08xxx", "08yyy"]'
  User?: User
}

const TodaysTaskList: React.FC = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPhones, setSelectedPhones] = useState<string[]>([])
  const [selectedPhone, setSelectedPhone] = useState('')
  const [activeDebtor, setActiveDebtor] = useState<Debtor | null>(null)
  const [isCalling, setIsCalling] = useState(false)
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

  const handleCallClick = (debtor: Debtor) => {
    try {
      const phones = debtor.mobilePhones
      if (Array.isArray(phones) && phones.length > 0) {
        setSelectedPhones(phones)
        setSelectedPhone('')
        setActiveDebtor(debtor)
        setShowModal(true)
      } else {
        toast.error('No phone numbers available')
      }
    } catch {
      toast.error('Invalid phone number format')
    }
  }

  const normalizePhoneNumber = (number: string) => {
    if (!number) return ''
    // Hilangkan spasi, tanda hubung, atau titik jika ada
    number = number.replace(/[\s-.]/g, '')
    if (number.startsWith('0')) {
      return '+62' + number.slice(1)
    }
    return number
  }

  const handleCallNow = async () => {
    if (!selectedPhone) return toast.error('Please select a phone number.')

    setIsCalling(true)

    const debtorPhone = normalizePhoneNumber(selectedPhone)
    const collectorPhone = normalizePhoneNumber(user?.phoneNumber || '')
    console.log(`Calling ${debtorPhone} for ${getFullName(activeDebtor!)}`, collectorPhone, 'collector Phone')

    try {
      const payload = {
        debtorData:activeDebtor,
        to: collectorPhone,
        debtorNumber: debtorPhone
      }

      const res = await fetch('/api/twilio/phone-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData?.error || 'Failed to initiate call'
        console.log(errorData.message, 'errorData')
        toast.error(`${errorMessage}${errorData.message ? `: ${errorData.message}` : ''}`)
        return
      }

      const data = await res.json()
      console.log('✅ Call:', data)
    } catch (err) {
      toast.error(`❌ Failed to initiate call: ${err instanceof Error ? err.message : String(err)}`)
      console.error('❌ Failed to initiate call:', err)
    } finally {
      setIsCalling(false)
      setShowModal(false)
    }
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
                  <td className="px-4 py-3">{debtor.User?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-700 dark:text-green-400">
                    {formatCurrency(debtor.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">{getPriorityBadge(debtor.forecast)}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={getDebtorHref(debtor.id)}
                      className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded inline-flex items-center justify-center"
                    >
                      <FiEye />
                    </Link>
                    <button
                      className="text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded"
                      onClick={() => handleCallClick(debtor)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md w-full text-gray-800 dark:text-gray-100">
            <h2 className="text-lg font-semibold mb-4">
              Select Phone Number {activeDebtor && getFullName(activeDebtor)}
            </h2>
            <div className="space-y-2 mb-4">
              {selectedPhones.map((phone, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="phone"
                    value={phone}
                    checked={selectedPhone === phone}
                    onChange={() => setSelectedPhone(phone)}
                    className="accent-blue-500"
                  />
                  {phone}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={handleCallNow}
                disabled={isCalling}
                className={`px-4 py-2 rounded text-white ${
                  isCalling ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isCalling ? 'Calling...' : 'Call Now'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default TodaysTaskList
