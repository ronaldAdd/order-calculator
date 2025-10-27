'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { toast } from 'react-toastify'
import ReactSelect from 'react-select'
import { FiFilter } from 'react-icons/fi'
import reactSelectStylesMulti from '@/lib/reactSelectStylesMulti'
import reactSelectStylesSingle from '@/lib/reactSelectStylesSingle'
import { statusOptions, forecastOptions, productNameOptions } from '@/constants/formOptions'
import useUserStore from '@/src/store/useUserStore'
import Pusher from 'pusher-js'

interface Debtor {
  id: string
  firstName: string
  lastName: string
  productName: string
  loanId: string
  outstandingAmount: number
  status: string
  forecast: string
}

interface Collector {
  id: string
  name: string
}

interface Filters {
  status?: string
  forecast?: string
  productName?: string[]
  outstandingMin?: string
  outstandingMax?: string
  assignedCollector?: string
}

export default function BulkDistributionPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([])
  const [selectedCollectors, setSelectedCollectors] = useState<string[]>([])
  const [distributionType, setDistributionType] = useState<'even' | 'roundrobin'>('even')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({})
  const [localFilters, setLocalFilters] = useState<Filters>({})
  const uid = useUserStore((s) => s.user?.uid)
  const [progress, setProgress] = useState<number | null>(null)
  const [loadingDebtors, setLoadingDebtors] = useState(false)

  
  useEffect(() => {
    const saved = localStorage.getItem('bulkFilters')
    if (saved) {
      const parsed = JSON.parse(saved)
      setFilters(parsed)
      setLocalFilters(parsed)
    }
  }, [])

  useEffect(() => {
    fetchDebtors()
    fetchCollectors()
  }, [page, filters])



  useEffect(() => {
    if (!uid) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(`distribution-${uid}`)
    channel.bind('distribution-progress', (data: { progress: number }) => {
      setProgress(data.progress)
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [uid])  

  const fetchDebtors = async () => {
    setLoadingDebtors(true) // show spinner

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      sortBy: 'firstName',
      sortOrder: 'ASC',
      assignedCollector: 'nullOrEmpty',
    })

    if (filters.status) params.append('status', filters.status)
    if (filters.forecast) params.append('forecast', filters.forecast)
    if (filters.productName) filters.productName.forEach(v => params.append('productName', v))
    if (filters.outstandingMin) params.append('outstandingMin', filters.outstandingMin)
    if (filters.outstandingMax) params.append('outstandingMax', filters.outstandingMax)

    try {
      const res = await fetch(`/api/debtors/bulk-distribution?${params.toString()}`)
      const json = await res.json()
      setDebtors(json.data || [])
      setTotalPages(json.totalPages || 1)
      setPage(json.page || 1)
    } catch (error) {
      console.log(error,'Failed to load debtors');
      toast.error('Failed to load debtors')
    } finally {
      setLoadingDebtors(false) // hide spinner
    }
  }


  const fetchCollectors = async () => {
    const res = await fetch('/api/users/lists')
    const json = await res.json()
    setCollectors(json.data || [])
  }

  const toggleDebtorSelection = (id: string) => {
    setSelectedDebtors(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    )
  }

  const handleDistribute = async () => {
    if (selectedDebtors.length === 0 || selectedCollectors.length === 0) {
      toast.error('Please select debtors and collectors')
      return
    }

    if (!uid) {
      toast.error('User ID not found')
      return
    }    

    setLoading(true)
    setProgress(0)

    const res = await fetch('/api/debtors/distribute-debtors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtorIds: selectedDebtors,
        collectorIds: selectedCollectors,
        type: distributionType,
        uid,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (res.ok) {
      toast.success(json.message || 'Distribution complete')
      setSelectedDebtors([])
      fetchDebtors()
    } else {
      toast.error(json.message || 'Distribution failed')
    }
  }

  return (
    <MainLayout title="Bulk Distribution">
      <div className="p-6 text-gray-800 dark:text-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Bulk Distribution</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <FiFilter className="mr-2" /> Filter
          </button>
        </div>

        <ReactSelect
          isMulti
          options={collectors.map(c => ({ label: c.name, value: c.id }))}
          onChange={options => setSelectedCollectors(options.map(o => o.value))}
          styles={reactSelectStylesMulti}
        />

        <div className="mt-2">
          <label className="mr-4 font-medium dark:text-gray-300">Distribution Method:</label>
          <label className="mr-4 text-gray-800 dark:text-gray-200">
            <input type="radio" checked={distributionType === 'even'} onChange={() => setDistributionType('even')} className="mr-1" />
            Evenly
          </label>
          <label className="text-gray-800 dark:text-gray-200">
            <input type="radio" checked={distributionType === 'roundrobin'} onChange={() => setDistributionType('roundrobin')} className="mr-1" />
            Round-robin
          </label>


                {loading && (
                  <div className="mt-4">
                    <p className="text-sm mb-1">Distribution Progress: {progress}%</p>
                    <div className="w-full h-3 bg-gray-200 rounded">
                      <div
                        className="h-3 bg-green-600 rounded"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}  

          <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200">
            <div className="font-semibold mb-2">Method Information</div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="py-1 pr-2 font-medium">Method</th>
                  <th className="py-1 font-medium">Best Used When</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 pr-2">Evenly</td>
                  <td className="py-1">You want to balance the workload equally among all collectors.</td>
                </tr>
                <tr>
                  <td className="py-1 pr-2">Round-robin</td>
                  <td className="py-1">You want to distribute one by one in a fair and rotating order.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {loadingDebtors  && (
          <div className="text-center mb-4 mt-4">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-blue-500"></span>
            <p className="text-sm mt-2">Loading...</p>
          </div>
        )}

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 select-none">
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={debtors.every((d) => selectedDebtors.includes(d.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Tambah semua ID dari halaman saat ini, hindari duplikat
                        const newIds = debtors
                          .map((d) => d.id)
                          .filter((id) => !selectedDebtors.includes(id))
                        setSelectedDebtors((prev) => [...prev, ...newIds])
                      } else {
                        // Hapus hanya ID yang ada di halaman ini
                        setSelectedDebtors((prev) =>
                          prev.filter((id) => !debtors.map((d) => d.id).includes(id))
                        )
                      }
                    }}
                  />
                </th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Outstanding Amount</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((debtor) => (
                <tr key={debtor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDebtors.includes(debtor.id)}
                      onChange={() => toggleDebtorSelection(debtor.id)}
                    />
                  </td>
                  <td className="p-2">{debtor.firstName} {debtor.lastName}</td>
                  <td className="p-2">{debtor.productName}</td>
                  <td className="p-2">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(debtor.outstandingAmount)}</td>
                  <td className="p-2">{debtor.status}</td>
                  <td className="p-2">{debtor.forecast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center space-x-2">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
        </div>

        <div className="mt-4">
          <button
            onClick={handleDistribute}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
            disabled={loading || selectedDebtors.length === 0 || selectedCollectors.length === 0}
          >
            {loading ? 'Distributing...' : 'Distribute Selected Debtors'}
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Filter Debtors</h2>

              {/* Status */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Status</label>
                <ReactSelect
                  isClearable
                  options={statusOptions.map(v => ({ label: v, value: v }))}
                  value={localFilters.status ? { value: localFilters.status, label: localFilters.status } : null}
                  onChange={(option) => setLocalFilters(f => ({ ...f, status: option?.value }))}
                  styles={reactSelectStylesSingle}
                />
              </div>

              {/* Forecast */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Forecast</label>
                <ReactSelect
                  isClearable
                  options={forecastOptions.map(v => ({ label: v, value: v }))}
                  value={localFilters.forecast ? { value: localFilters.forecast, label: localFilters.forecast } : null}
                  onChange={(option) => setLocalFilters(f => ({ ...f, forecast: option?.value }))}
                  styles={reactSelectStylesSingle}
                />
              </div>

              {/* Product */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Product</label>
                <ReactSelect
                  isMulti
                  isClearable
                  options={productNameOptions}
                  value={localFilters.productName?.map(v => ({ label: v, value: v }))}
                  onChange={(options) => setLocalFilters(f => ({ ...f, productName: options?.map(o => o.value) }))}
                  styles={reactSelectStylesMulti}
                />
              </div>

              {/* Outstanding */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Outstanding (Min-Max)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={localFilters.outstandingMin || ''} onChange={(e) => setLocalFilters(f => ({ ...f, outstandingMin: e.target.value }))} className="w-1/2 px-3 py-1 border rounded dark:bg-gray-800" />
                  <input type="number" placeholder="Max" value={localFilters.outstandingMax || ''} onChange={(e) => setLocalFilters(f => ({ ...f, outstandingMax: e.target.value }))} className="w-1/2 px-3 py-1 border rounded dark:bg-gray-800" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setLocalFilters({})
                    setFilters({})
                    localStorage.removeItem('bulkFilters')
                    setModalOpen(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Clear Filter
                </button>
                <button
                  onClick={() => {
                    setFilters(localFilters)
                    localStorage.setItem('bulkFilters', JSON.stringify(localFilters))
                    setModalOpen(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
