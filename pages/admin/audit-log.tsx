'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { FiFilter } from 'react-icons/fi'
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa'

interface AuditLog {
  id: string
  actorId: string
  actorName: string
  actionType: string
  targetEntityId: string
  description: string
  timestamp: string
  details?: Record<string, unknown>
}

type FilterParams = {
  actorId?: string
  actorName?: string
  actionType?: string
  targetEntityId?: string
  dateStart?: string
  dateEnd?: string
}


export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterParams>({})
  const [localFilters, setLocalFilters] = useState<FilterParams>({})
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)


  useEffect(() => {
    setPage(1)
  }, [filters, sortBy, sortOrder])

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(filters.actorId && { actorId: filters.actorId }),
        ...(filters.actorName && { actorName: filters.actorName }),
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.targetEntityId && { targetEntityId: filters.targetEntityId }),
        ...(filters.dateStart && { dateStart: filters.dateStart }),
        ...(filters.dateEnd && { dateEnd: filters.dateEnd }),
      })

      try {
        const res = await fetch(`/api/audit-log?${params.toString()}`)
        const json = await res.json()
        setLogs(json.data || [])
        setTotalPages(json.totalPages || 1)
      } catch (err) {
        console.error('Failed to fetch audit logs', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
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
    <MainLayout title="Audit Log">
      <div className="p-6 text-gray-800 dark:text-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Audit Log</h1>
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
                  <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('timestamp')}>Timestamp {renderSortIcon('timestamp')}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('actorName')}>Actor {renderSortIcon('actorName')}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('actionType')}>Action {renderSortIcon('actionType')}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('targetEntityId')}>Target {renderSortIcon('targetEntityId')}</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2">{log.actorName}</td>
                    <td className="p-2">{log.actionType}</td>
                    <td className="p-2">{log.targetEntityId}</td>
                    <td className="p-2">{log.description}</td>
                    <td className="p-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setSelectedLog(log)}
                      >
                        View
                      </button>
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
              <h2 className="text-xl font-bold mb-4">Filter Audit Logs</h2>

              {[
                { label: 'Actor Name', name: 'actorName' },
                { label: 'Actor ID', name: 'actorId' },
                { label: 'Action Type', name: 'actionType' },
                { label: 'Target Entity ID', name: 'targetEntityId' }
              ].map(({ label, name }) => (
                <div className="mb-4" key={name}>
                  <label className="block mb-1 font-medium">{label}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800"
                    value={localFilters[name as keyof FilterParams] || ''}
                    onChange={(e) =>
                      setLocalFilters((f) => ({ ...f, [name as keyof FilterParams]: e.target.value }))
                    }
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

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-2xl w-full overflow-auto max-h-[80vh]">
              <h2 className="text-xl font-bold mb-4">Log Details</h2>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
              <div className="flex justify-end mt-4">
                <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
