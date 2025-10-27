'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import MainLayout from '../../components/MainLayout'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type User = {
  id: string
  uid: string
  email?: string
  name?: string
  role?: string
  disabled?: boolean
  createdAt?: string | null
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UserListPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(100)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [togglingUid, setTogglingUid] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?page=${page}&limit=${limit}&search=${searchTerm}`)
      const data = await res.json()
      setUsers(data.data || [])
      setPagination(data.pagination || null)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('❌ Failed to fetch user list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, searchTerm])

  const handleNext = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  const toggleDisableUser = async (uid: string, disable: boolean) => {
    setTogglingUid(uid)
    try {
      const res = await fetch("/api/users/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, disable }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(`❌ ${data.error || "Failed to update user status"}`)
      } else {
        toast.success(`✅ User ${disable ? 'disabled' : 'enabled'} successfully`)
        await fetchUsers()
      }
    } catch {
      toast.error("❌ Failed to update user status")
    } finally {
      setTogglingUid(null)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">User List</h1>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setPage(1)
              setSearchTerm(e.target.value)
            }}
            className="w-full sm:w-96 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />

          <button
            onClick={() => router.push("/admin/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded whitespace-nowrap"
          >
            Add New User
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No users found.</p>
        ) : (
          <>
            <div className="overflow-auto rounded shadow border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-left text-sm table-auto">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">UID</th>
                    <th className="px-4 py-2 font-medium">Created At</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-2 text-sm">{user.email || "-"}</td>
                      <td className="px-4 py-2 text-sm">{user.name || "-"}</td>
                      <td className="px-4 py-2 text-sm">{user.role || "-"}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{user.id}</td>
                      <td className="px-4 py-2 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-4 py-2 text-sm">
                        {user.disabled ? (
                          <span className="text-red-600 font-semibold">Disabled</span>
                        ) : (
                          <span className="text-green-600 font-semibold">Enabled</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          disabled={togglingUid === user.id}
                          onClick={() => toggleDisableUser(user.id, !user.disabled)}
                          className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                            user.disabled
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          } disabled:opacity-50`}
                        >
                          {user.disabled ? "Enable" : "Disable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-center mt-4 gap-2">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Page {page}</span>
                <button
                  onClick={handleNext}
                  disabled={!pagination || page >= pagination.totalPages}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </MainLayout>
  )
}
