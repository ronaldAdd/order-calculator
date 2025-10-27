'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import useUserStore from '@/src/store/useUserStore'
import { useRouter } from 'next/router'

type Customer = {
  id: number
  name: string
  email: string
  phone: string
  company: string
  isActive: boolean
}

const dummyCustomers: Customer[] = Array.from({ length: 57 }, (_, i) => ({
  id: i + 1,
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  phone: `+62 812 0000 00${i + 1}`,
  company: `Company ${Math.ceil((i + 1) / 5)}`,
  isActive: i % 2 === 0,
}))

export default function CustomerListPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const role = user?.role || ''

  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Customer[]>(dummyCustomers)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const result = dummyCustomers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const canCreate = ['admin'].includes(role)
  const canEdit = ['admin'].includes(role)
  const canDelete = ['admin'].includes(role)
  const canView = !!role // semua yang login bisa view

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      alert(`Mock delete: ${id}`)
    }
  }

  return (
    <MainLayout title="Customer List">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Customer List</h1>

          {canCreate && (
            <button
              onClick={() => router.push(`/${role}/customers/new`)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Customer
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <table className="w-full border text-sm border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              <th className="p-2 border dark:border-gray-600">Name</th>
              <th className="p-2 border dark:border-gray-600">Email</th>
              <th className="p-2 border dark:border-gray-600">Phone</th>
              <th className="p-2 border dark:border-gray-600">Company</th>
              <th className="p-2 border dark:border-gray-600">Status</th>
              {canView && <th className="p-2 border dark:border-gray-600 w-32 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-2 border dark:border-gray-600">{c.name}</td>
                <td className="p-2 border dark:border-gray-600">{c.email}</td>
                <td className="p-2 border dark:border-gray-600">{c.phone}</td>
                <td className="p-2 border dark:border-gray-600">{c.company}</td>
                <td className="p-2 border dark:border-gray-600">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      c.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canView && (
                  <td className="p-2 border dark:border-gray-600 text-center space-x-2">
                    <button
                      onClick={() => alert(`Read ID ${c.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => router.push(`/customers/edit/${c.id}`)}
                        className="text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-700 dark:text-gray-300">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-gray-100 dark:bg-gray-700 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-gray-100 dark:bg-gray-700 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
