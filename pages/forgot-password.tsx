import Head from 'next/head'
import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('Password reset email sent. Please check your inbox.')
    } catch (err) {
      console.error(err)
      setError('Failed to send reset email. Please check the email address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password - MyApp</title>
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4">
        <form
          onSubmit={handleResetPassword}
          className="bg-white rounded-lg shadow-md p-8 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-[#0f172a]">
            Forgot Password
          </h1>

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium mb-1 text-[#0f172a]">
              Enter your email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 font-semibold">{error}</p>
          )}

          {message && (
            <p className="text-green-600 text-sm mb-4 font-semibold">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>

          <div className="mt-6 text-center text-sm text-[#0f172a]">
            <Link href="/signin" className="hover:underline text-blue-600">
              Back to Sign In
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
