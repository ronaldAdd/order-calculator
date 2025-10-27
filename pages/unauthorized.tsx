import MainLayout from '@/components/MainLayout'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
        <p className="text-gray-700 text-lg mb-6">
          You don’t have permission to access this page.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Go to Home
        </Link>
      </div>
    </MainLayout>
  )
}
