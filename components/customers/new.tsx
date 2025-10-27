'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function NewCustomerPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    taxId: '',
    contactPerson: '',
    notes: '',
    isActive: true,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const fieldValue =
      type === 'checkbox' && 'checked' in e.target
        ? (e.target as HTMLInputElement).checked
        : value

    setForm(prev => ({
      ...prev,
      [name]: fieldValue,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success('Customer data submitted (mock only)')
      console.log('Submitted customer form:', form)
      setLoading(false)
    }, 500)
  }

  return (
    <MainLayout title="New Customer">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Add New Customer</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone / WhatsApp
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+62 ..."
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            name="address"
            rows={2}
            value={form.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID (NPWP)
          </label>
          <input
            type="text"
            name="taxId"
            value={form.taxId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person (PIC)
          </label>
          <input
            type="text"
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            id="isActive"
            className="h-4 w-4 text-blue-600"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Active Customer
          </label>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-4 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              'Save (Mock)'
            )}
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  )
}
