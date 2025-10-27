import MainLayout from '../../components/MainLayout'

export default function Home() {
  return (
    <MainLayout>
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Welcome to the Dashboard
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        This is your main content area. You can add charts, tables, etc. here.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Example Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Outstanding Debt</p>
          <h3 className="text-2xl font-bold text-red-600">Rp 152,000,000</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Collected This Month</p>
          <h3 className="text-2xl font-bold text-green-600">Rp 37,000,000</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Debtors</p>
          <h3 className="text-2xl font-bold text-blue-600">86</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Overdue Accounts</p>
          <h3 className="text-2xl font-bold text-yellow-600">14</h3>
        </div>
      </div>
    </MainLayout>
  )
}
