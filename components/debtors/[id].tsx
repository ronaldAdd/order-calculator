'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DebtorForm, { DebtorFormData } from '@/components/debtors/DebtorForm'
import MainLayout from '@/components/MainLayout'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useUserStore from '@/src/store/useUserStore'
import { logActivity } from '@/lib/logActivity'
import debtorSchema from '@/schemas/debtorSchema'

type Relations = {
  relationName: string
  relationshipType: string
  relationPhone: string
}

type BankAccounts = {
  accountHolder: string
  bankName: string
  accountNumber: string
}

function parseJsonField<T>(field: unknown, fieldName: string): T[] {
  if (Array.isArray(field)) return field
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field)
      if (Array.isArray(parsed)) return parsed
      console.warn(`⚠️ Field ${fieldName} parsed tapi bukan array:`, parsed)
      return []
    } catch {
      console.warn(`❌ Gagal parse field ${fieldName}:`, field)
      return []
    }
  }
  return []
}

export default function EditDebtorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const user = useUserStore((s) => s.user)
  const role = user?.role || ''
  const permissions = user?.permissions || []
  const canUpdate = permissions.includes('update')

  const [initialData, setInitialData] = useState<DebtorFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function fetchDebtor() {
      try {
        const res = await fetch(`/api/debtors/${id}`)
        const result = await res.json()

        if (!res.ok || result.success === false) {
          throw new Error(result.message || 'Failed to load debtor data')
        }

        const parsedData: DebtorFormData = {
          ...result.data,
          mobilePhones: parseJsonField<string>(result.data.mobilePhones, 'mobilePhones'),
          relations: parseJsonField<Relations>(result.data.Relations, 'Relations'),
          bankAccounts: parseJsonField<BankAccounts>(result.data.BankAccounts, 'BankAccounts'),
        }

        setInitialData(parsedData)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchDebtor()
  }, [id])

  if (!user) return null

  if (!canUpdate) {
    if (typeof window !== 'undefined') {
      toast.error('You do not have permission to edit debtors')
      router.push('/unauthorized')
    }
    return null
  }

  const handleUpdate = async (data: DebtorFormData) => {


    // ✅ Validasi Zod sebelum submit
    const parsed = debtorSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errors).flat()[0]
      toast.error(firstError || 'Invalid form data')
      return
    }

    try {
      const res = await fetch(`/api/debtors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!result.success) {
        // 🛑 Ambil error pertama dari response validasi
        const firstZodError = result.errors
          ? Object.values(result.errors)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any          
              .map((e: any) => e._errors?.[0])
              .find((msg) => !!msg)
          : null

        const message = firstZodError || result.message || 'Gagal update debtor'
        throw new Error(message)
      }
          const newId = result.id || result.data?.id

      // ✅ Logging aktivitas
      await logActivity({
        uid: user.uid,
        email: user.email,
        activity: `Updated debtor ID ${newId}`,
      })

      toast.success(result.message || 'Debtor updated successfully')
      router.push(`/${role}/debtors`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(message)
    }
  }

  if (!id) {
    return (
      <MainLayout title="Edit Debtor">
        <p className="text-center py-10 text-red-500">Invalid debtor ID</p>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout title="Edit Debtor">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-40"></div>
        </div>
      </MainLayout>
    )
  }

  if (!initialData) {
    return (
      <MainLayout title="Edit Debtor">
        <p className="text-center py-10 text-red-500">Debtor not found</p>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Edit Debtor">
      <div className="max-w-5xl mx-auto py-8 text-gray-800 dark:text-gray-100">
        <DebtorForm initialData={initialData} onSubmit={handleUpdate} />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  )
}
