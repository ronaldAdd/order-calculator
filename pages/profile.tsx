'use client'

import { useEffect, useState, ChangeEvent } from 'react'
import Image from 'next/image'
import MainLayout from '../components/MainLayout'
import useUserStore from '../src/store/useUserStore'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function Profile() {
  const user = useUserStore((state) => state.user)
  const updateAvatar = useUserStore((state) => state.updateAvatar)
  const updateName = useUserStore((state) => state.updateName)
  const updatePhoneNumber = useUserStore((state) => state.updatePhoneNumber);

  const [photo, setPhoto] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bio, setBio] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.uid) return
      try {
        const res = await fetch(`/api/users/${user.uid}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch user')

        const u = data.user
        setFullName(u.name || '')
        setEmail(u.email || '')
        setPhoneNumber(u.phoneNumber || '')
        setBio(u.bio || '')
        setPhoto(u.avatar || null)
        setRole(u.role || '')
      } catch (err) {
        console.error('❌ Fetch user failed:', err)
        toast.error('Failed to fetch user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [user])

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return
    setSaving(true)

  // Validasi phone number
  const phoneRegex = /^\+62[0-9]{9,14}$/ // Contoh: +6281234567890
  if (!phoneRegex.test(phoneNumber)) {
    toast.error('Phone number must start with +62 and be 9-14 digits long')
    setSaving(false)
    return
  }

    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phoneNumber,
          bio,
          avatar: photo,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update user')

      toast.success('Profile updated successfully')
      updateAvatar(photo || '')
      updateName(fullName)
      updatePhoneNumber(phoneNumber);
    } catch (err) {
      console.error('❌ Update profile failed:', err)
      toast.error('Failed to update profile')
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">User Profile</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded shadow max-w-md mx-auto text-gray-800 dark:text-gray-100"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-gray-300 dark:border-gray-600 relative">
            <Image
              src={photo || 'https://i.pravatar.cc/100'}
              alt="User Avatar"
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
          <label
            htmlFor="photo-upload"
            className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
          >
            Upload New Photo
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block font-medium mb-1">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block font-medium mb-1">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="+62 812 3456 7890"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block font-medium mb-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
            />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Role:</strong> {role || 'N/A'}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  )
}
