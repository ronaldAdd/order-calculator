import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-6">Welcome to MyApp</h1>
      <p className="text-xl max-w-xl mb-8">
        Your all-in-one dashboard to manage users, settings, and more with ease.
      </p>
      <Link
        href="/admin"
        className="bg-white text-blue-600 font-semibold px-6 py-3 rounded shadow hover:bg-gray-100 transition"
      >
        Get Started
      </Link>
    </div>
  )
}
