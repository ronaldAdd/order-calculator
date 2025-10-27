'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import DebtorView, { DebtorViewData } from '@/components/debtors/DebtorView'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useUserStore from '@/src/store/useUserStore'

type EmergencyContact = {
  name: string
  relationship: string
  phone: string
}

type BankAccount = {
  accountHolder: string
  bankName: string
  accountNumber: string
}

function parseJsonField<T>(field: unknown): T[] {
  if (!field) return []
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T[]
    } catch {
      return []
    }
  }
  return field as T[]
}

export default function ViewDebtorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const user = useUserStore((s) => s.user)
  const permissions = user?.permissions || []
  const canRead = permissions.includes('read')

  const [data, setData] = useState<DebtorViewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function fetchData() {
      try {
        const res = await fetch(`/api/debtors/${id}`)
        if (!res.ok) throw new Error('Failed to load debtor data')
        const json = await res.json()

        const parsed: DebtorViewData = {
          ...json.data,
          mobilePhones: parseJsonField<string>(json.data.mobilePhones),
          emergencyContacts: parseJsonField<EmergencyContact>(json.data.emergencyContacts),
          bankAccounts: parseJsonField<BankAccount>(json.data.bankAccounts),
        }

        setData(parsed)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (!user) return null

  if (!canRead) {
    if (typeof window !== 'undefined') {
      toast.error('You do not have permission to view debtors')
      router.push('/unauthorized')
    }
    return null
  }

  if (!id) {
    return (
      <MainLayout title="View Debtor">
        <p className="text-center py-10 text-red-500">Invalid debtor ID</p>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout title="View Debtor">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid border-opacity-40"></div>
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout title="View Debtor">
        <p className="text-center py-10 text-red-500">Debtor not found</p>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Debtor Details">
      <div className="max-w-5xl mx-auto py-8 text-gray-800 dark:text-gray-100">
        <DebtorView data={data} />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  )
}
