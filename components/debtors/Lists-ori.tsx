'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { useRouter } from 'next/router'
import useUserStore from '@/src/store/useUserStore'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi'
import { logActivity } from "@/lib/logActivity";

type Collector = {
  id: string
  name: string
  email: string
  role: string
}

type Debtor = {
  id: string
  firstName: string
  lastName: string
  productName: string
  loanId: string
  assignedCollector: string
  outstandingAmount: number
  status: string
  forecast: string
  User?: Collector
}

type SortBy =
  | 'firstName'
  | 'lastName'
  | 'productName'
  | 'loanId'
  | 'assignedCollector'
  | 'outstandingAmount'
  | 'status'
  | 'forecast'

type Filters = {
  [key in SortBy]?: string
}

const columnAliases: Record<SortBy, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  productName: 'Product',
  loanId: 'Loan ID',
  assignedCollector: 'Collector',
  outstandingAmount: 'Outstanding',
  status: 'Status',
  forecast: 'Forecast',
}

function FilterModal({
  localFilters,
  onChange,
  onClose,
  onApply,
  onClear,
}: {
  localFilters: Filters
  onChange: (col: SortBy, val: string) => void
  onClose: () => void
  onApply: () => void
  onClear: () => void
}) {
  const statusOptions = ['New', 'Contacted', 'Promise to Pay', 'Paid', 'Inactive']
  
  const forecastOptions = ['High', 'Medium', 'Low']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md w-full">
        <h2 className="text-xl mb-4 font-semibold text-gray-900 dark:text-gray-100">Filter Debtors</h2>

        {(Object.keys(columnAliases) as SortBy[]).map((col) => (
          <div key={col} className="mb-3">
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
              {columnAliases[col]}
            </label>

            {col === 'status' ? (
              <select
                value={localFilters[col] || ''}
                onChange={(e) => onChange(col, e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- All Status --</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : col === 'forecast' ? (
              <select
                value={localFilters[col] || ''}
                onChange={(e) => onChange(col, e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- All Forecast --</option>
                {forecastOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={col === 'outstandingAmount' ? 'number' : 'text'}
                value={localFilters[col] || ''}
                onChange={(e) => onChange(col, e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={onClear} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Clear Filter
          </button>
          <button onClick={onApply} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}


export default function DebtorListPage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const role = user?.role || ''
  const permissions = user?.permissions || []

  

  const canCreate = permissions.includes('create')
  const canRead = permissions.includes('read')  
  const canUpdate = permissions.includes('update')
  const canDelete = permissions.includes('delete')

  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [filters, setFilters] = useState<Filters>({})
  const [sortBy, setSortBy] = useState<SortBy>('firstName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<Filters>({})
  const [filterLoaded, setFilterLoaded] = useState(false)

  useEffect(() => {
    const savedFilters = localStorage.getItem('debtorFilters')
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters)
      setFilters(parsed)
      setLocalFilters(parsed)
    }
    setFilterLoaded(true)
  }, [])


  const fetchData = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
    })

    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })


    try {
      setLoading(true)
      const res = await fetch(`/api/debtors?${params.toString()}`)
      const json = await res.json()
      setDebtors(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (filterLoaded) {
      fetchData()
    }
  }, [filters, sortBy, sortOrder, currentPage, filterLoaded])

  const handleSortClick = (col: SortBy) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
  }

  const handleLocalFilterChange = (col: SortBy, val: string) => {
    setLocalFilters((prev) => ({ ...prev, [col]: val }))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-500 text-white'
      case 'Contacted':
        return 'bg-orange-500 text-white'
      case 'Promise to Pay':
        return 'bg-yellow-400 text-black'
      case 'Paid':
        return 'bg-green-600 text-white'
      case 'Inactive':
        return 'bg-red-600 text-white'
      case 'Invalid':
        return 'bg-red-600 text-white'
      default:
        return 'bg-gray-400 text-white'
    }
  }  

  return (
    <MainLayout title="Debtor List">
      <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Debtor List</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setLocalFilters(filters)
                setModalOpen(true)
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Filter
            </button>
             {canCreate && (
                <button
                  onClick={() => router.push(`/${role}/debtors/new`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + New
                </button>
                )}
          </div>
        </div>

        {loading && (
          <div className="text-center mb-4">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-blue-500"></span>
            <p className="text-sm mt-2">Loading...</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 select-none">
                {(Object.keys(columnAliases) as SortBy[]).map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSortClick(col)}
                    className={`p-2 cursor-pointer ${col === 'outstandingAmount' ? 'text-right' : ''}`}
                  >
                    <div className="flex justify-between items-center select-none">
                      <span>{columnAliases[col]}</span>
                      <span>{sortBy === col ? (sortOrder === 'asc' ? '🔼' : '🔽') : '⇅'}</span>
                    </div>
                  </th>
                ))}
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && debtors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4">
                    No data
                  </td>
                </tr>
              ) : (
                debtors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <td className="p-2">{d.firstName}</td>
                    <td className="p-2">{d.lastName}</td>
                    <td className="p-2">{d.productName}</td>
                    <td className="p-2">{d.loanId}</td>
                    {/* Tampilkan nama collector dari objek collector */}
                    <td className="p-2">{d.User?.name || '-'}</td>
                    <td className="p-2 text-right">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(d.outstandingAmount)}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-2">{d.forecast}</td>
                    <td className="p-2 space-x-2 flex items-center">
                      {canRead && (
                        <button
                          onClick={() => router.push(`/${role}/debtors/view/${d.id}`)}
                          className="text-green-500 hover:text-green-700 flex items-center space-x-1"
                          title="View debtor"
                        >
                          <FiEye size={18} />
                          <span>View</span>
                        </button>
                        )}
                        {canUpdate && (                    
                          <button
                            onClick={() => router.push(`/${role}/debtors/edit/${d.id}`)}
                            className="text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                            title="Edit debtor"
                          >
                            <FiEdit size={18} />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDelete && (
                      <button
                        onClick={() => {
                          toast(
                            ({ closeToast }) => (
                              <div>
                                <p className="mb-2 font-medium">{`Are you sure you want to permanently delete the record for ${d.firstName} ${d.lastName}? This action cannot be undone.`}</p>
                                <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/debtors/${d.id}`, {
                                            method: 'DELETE',
                                          })
                                          if (!res.ok) throw new Error()
                                          // ✅ Logging manual
                                            if (user) {
                                              await logActivity({
                                                uid: user.uid,
                                                email: user.email,
                                                activity: `Deleted debtor ID ${d.id}`,
                                              });
                                            }
                                          setDebtors((prev) => prev.filter((x) => x.id !== d.id))
                                          closeToast?.()
                                          toast.success('Deleted')
                                        } catch {
                                          toast.error('Failed to delete')
                                        }
                                      }}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Confirm
                                    </button>
                                  <button onClick={() => closeToast?.()} className="bg-gray-300 px-3 py-1 rounded text-sm">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ),
                            { closeOnClick: false, autoClose: false }
                          )
                        }}
                        className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                        title="Delete debtor"
                      >
                        <FiTrash2 size={18} />
                        <span>Delete</span>
                      </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {modalOpen && (
          <FilterModal
            localFilters={localFilters}
            onChange={handleLocalFilterChange}
            onClose={() => setModalOpen(false)}
            onApply={() => {
              setFilters(localFilters)
              setCurrentPage(1)
              localStorage.setItem('debtorFilters', JSON.stringify(localFilters))
              setModalOpen(false)
            }}
            onClear={() => {
              setLocalFilters({})
              localStorage.removeItem('debtorFilters')
            }}
          />
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </MainLayout>
  )
}
