'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function TwilioSettings() {
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(true) // ← loader state

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/twilio/settings', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        const { data } = await res.json()

        if (res.ok && data) {
          setAccountSid(data.accountSid || '')
          setAuthToken(data.authToken || '')
          setPhoneNumber(data.phoneNumber || '')
          setEnabled(data.enabled ?? true)
          setExisting(true)
        } else {
          setExisting(false)
        }
      } catch (err: unknown) {
        const error = err as Error
        console.error('Error loading settings:', error)
        toast.error('❌ Failed to load settings: ' + error.message)
      } finally {
        setLoading(false) // ← stop loader
      }
    }

    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const method = existing ? 'PUT' : 'POST'
      const res = await fetch('/api/twilio/settings', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountSid,
          authToken,
          phoneNumber,
          enabled,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save settings')
      }

      toast.success(
        existing ? '✅ Settings updated successfully' : '✅ Settings created successfully'
      )
      setExisting(true)
    } catch (err: unknown) {
      const error = err as Error
      toast.error('❌ Error saving settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid border-opacity-40"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <ToastContainer position="top-right" autoClose={3000} />

      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Twilio Settings</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md mx-auto text-gray-800 dark:text-gray-100"
      >
        <div className="space-y-4">
          <Input label="Account SID" value={accountSid} onChange={setAccountSid} />
          <Input label="Auth Token" value={authToken} onChange={setAuthToken} password />
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="+1 234 567 8901"
          />

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              id="enabled"
              className="w-5 h-5"
            />
            <label htmlFor="enabled" className="font-medium">
              Enabled
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : existing ? 'Update Settings' : 'Save Settings'}
          </button>
        </div>
      </form>
    </MainLayout>
  )
}

function Input({
  label,
  value,
  onChange,
  password = false,
  placeholder = '',
}: {
  label: string
  value: string
  onChange: (val: string) => void
  password?: boolean
  placeholder?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type={password && !showPassword ? 'password' : 'text'}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded px-3 py-2 pr-10"
        />
        {password && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center text-sm text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        )}
      </div>
    </div>
  )
}
