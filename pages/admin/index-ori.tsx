import MainLayout from '../../components/MainLayout'
import CollectionPerformanceChart from '../../components/CollectionPerformanceChart'
import AgingReceivablesChart from '../../components/AgingReceivablesChart'
import TopDebtors from '../../components/TopDebtors'
import CollectorPerformance from '../../components/CollectorPerformance'
import RecentPaymentsChart from '../../components/RecentPaymentsChart'  // <-- import

export default function Home() {
  return (
    <MainLayout>
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
        Welcome to the Dashboard
      </h2>
      {/* <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-xl">
        This is your main content area. You can add charts, tables, etc. here.
      </p> */}

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Outstanding Debt', value: 'Rp 152,000,000', color: 'text-red-600' },
          { label: 'Collected This Month', value: 'Rp 37,000,000', color: 'text-green-600' },
          { label: 'Debtors', value: '86', color: 'text-blue-600' },
          { label: 'Overdue Accounts', value: '14', color: 'text-yellow-600' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col items-center"
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
            <h3 className={`text-lg font-semibold ${color}`}>{value}</h3>
          </div>
        ))}
      </div>

      {/* Main content grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left big chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CollectionPerformanceChart />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <RecentPaymentsChart />
          </div>
        </div>

        {/* Side widgets stacked vertically with max height and scroll */}
        <div className="flex flex-col gap-6 max-h-[700px] overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <AgingReceivablesChart />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <TopDebtors />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CollectorPerformance />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
