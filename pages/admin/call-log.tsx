'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { FiFilter } from 'react-icons/fi'
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa'

interface CallLog {
  id: number
  debtorId: number
  collectorId: string
  timestamp: string
  notes: string
  callOutcome: string
  ptpDate?: string
  ptpAmount?: number
  callSid?: string
  callDuration?: number
  callStatus?: string
  recordingUrl?: string
  User?: {
    id: string
    name: string
    email: string
  }
}

type FilterParams = {
  debtorId?: string
  collectorId?: string
  callOutcome?: string
  dateStart?: string
  dateEnd?: string
}

export default function CallLogPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterParams>({})
  const [localFilters, setLocalFilters] = useState<FilterParams>({})
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(filters.debtorId && { debtorId: filters.debtorId }),
        ...(filters.collectorId && { collectorId: filters.collectorId }),
        ...(filters.callOutcome && { callOutcome: filters.callOutcome }),
        ...(filters.dateStart && { dateStart: filters.dateStart }),
        ...(filters.dateEnd && { dateEnd: filters.dateEnd }),
      })

      try {
        const res = await fetch(`/api/call-history?${params.toString()}`)
        const json = await res.json()
        setLogs(json.data || [])
        setTotalPages(json.totalPages || 1)
      } catch (err) {
        console.error('Failed to fetch call logs', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, filters, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setSortBy(column)
      setSortOrder('ASC')
    }
  }

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <FaSort className="inline ml-1" />
    return sortOrder === 'ASC' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />
  }

  return (
    <MainLayout title="Call Log">
      <div className="p-6 text-gray-800 dark:text-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Call Log</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <FiFilter className="mr-2" /> Filter
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('timestamp')}>Timestamp {renderSortIcon('timestamp')}</th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('User.name')}>Collector {renderSortIcon('User.name')}</th>
                  <th className="p-2">Debtor ID</th>
                  <th className="p-2">Outcome</th>
                  <th className="p-2">Duration</th>
                  <th className="p-2">Call Status</th>
                  <th className="p-2">Call SID</th>
                  <th className="p-2">Notes</th>
                  <th className="p-2">PTP</th>
                  <th className="p-2">Recording</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2">{log.User?.name || log.collectorId}</td>
                    <td className="p-2">{log.debtorId}</td>
                    <td className="p-2">{log.callOutcome || '-'}</td>
                    <td className="p-2">{log.callDuration != null ? `${log.callDuration}s` : '-'}</td>
                    <td className="p-2">{log.callStatus || '-'}</td>
                    <td className="p-2">{log.callSid || '-'}</td>
                    <td className="p-2">{log.notes || '-'}</td>
                    <td className="p-2">
                      {log.ptpDate ? `${new Date(log.ptpDate).toLocaleDateString()} - Rp${log.ptpAmount?.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2">
                      {log.recordingUrl ? (
                        <a href={log.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Play</a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-center space-x-2">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
        </div>

        {/* Filter Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Filter Call Logs</h2>

              {[{ label: 'Collector ID', name: 'collectorId' }, { label: 'Debtor ID', name: 'debtorId' }, { label: 'Call Outcome', name: 'callOutcome' }].map(({ label, name }) => (
                <div className="mb-4" key={name}>
                  <label className="block mb-1 font-medium">{label}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800"
                    value={localFilters[name as keyof FilterParams] || ''}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, [name as keyof FilterParams]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="mb-4">
                <label className="block mb-1 font-medium">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" className="w-1/2 px-3 py-2 border rounded dark:bg-gray-800" value={localFilters.dateStart || ''} onChange={(e) => setLocalFilters(f => ({ ...f, dateStart: e.target.value }))} />
                  <input type="date" className="w-1/2 px-3 py-2 border rounded dark:bg-gray-800" value={localFilters.dateEnd || ''} onChange={(e) => setLocalFilters(f => ({ ...f, dateEnd: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                <button onClick={() => { setLocalFilters({}); setFilters({}); setModalOpen(false) }} className="px-4 py-2 bg-red-600 text-white rounded">Clear</button>
                <button onClick={() => { setFilters(localFilters); setPage(1); setModalOpen(false) }} className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
