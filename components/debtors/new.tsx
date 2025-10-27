'use client'

import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import MainLayout from '@/components/MainLayout'
import useUserStore from '@/src/store/useUserStore'
import { logActivity } from '@/lib/logActivity'
import DebtorForm, { DebtorFormData } from '@/components/debtors/DebtorForm'
import debtorSchema from '@/schemas/debtorSchema'

export default function CreatePage() {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const permissions = user?.permissions || []

  const canCreate = permissions.includes('create')

  if (!user) return null // bisa diganti dengan spinner

  if (!canCreate) {
    if (typeof window !== 'undefined') {
      toast.error('You do not have permission to create debtors')
      router.push('/unauthorized')
    }
    return null
  }

  const handleCreate = async (data: DebtorFormData) => {
    // ✅ Validasi Zod sebelum submit
    const parsed = debtorSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errors).flat()[0]
      toast.error(firstError || 'Invalid form data')
      return
    }

    try {
      
      const res = await fetch('/api/debtors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data), // ✅ sudah tervalidasi
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Failed to create debtor')
      }

      const json = await res.json()
      const newId = json.id || json.data?.id

      // ✅ Logging manual
      await logActivity({
        uid: user.uid,
        email: user.email,
        activity: `Created debtor ID ${newId}`,
      })

      toast.success('Debtor created successfully', {
        autoClose: 3000,
        onClose: () => router.push('/admin/debtors'),
      })
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <MainLayout title="Debtor Form Tabs">
      <div className="max-w-5xl mx-auto py-8 text-gray-800 dark:text-gray-100">
        <DebtorForm onSubmit={handleCreate} />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </MainLayout>
  )
}
