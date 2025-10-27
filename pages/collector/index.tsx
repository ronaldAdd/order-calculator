'use client'

import { useEffect, useState } from 'react'
import MainLayout from '../../components/MainLayout'
import CollectionPerformanceChart from '../../components/CollectionPerformanceChart'
import PortfolioStatusChart from '../../components/PortfolioStatusChart'
import TodaysTaskList from '@/components/TodaysTaskList'

interface KPIData {
  totalOutstanding: number
  collected: number
  recoveryPercentage: number
  promisesToPayToday: number
}

export default function Home() {
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const res = await fetch('/api/debtors/kpis')
        const json = await res.json()
        setKpi(json)
      } catch (err) {
        console.error('❌ Failed to load KPI:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchKPI()
  }, [])

  const formatCurrency = (amount?: number) =>
    typeof amount === 'number' ? `Rp ${amount.toLocaleString('id-ID')}` : '...'

  return (
    <MainLayout>
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
        Welcome to the Dashboard
      </h2>

      {/* KPI Cards */}
      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 mb-8">Loading KPI...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Outstanding Debt',
              value: formatCurrency(kpi?.totalOutstanding),
              color: 'text-red-600',
            },
            {
              label: 'Collected This Month',
              value: formatCurrency(kpi?.collected),
              color: 'text-green-600',
            },
            {
              label: 'Recovery Rate',
              value:
                typeof kpi?.recoveryPercentage === 'number'
                  ? `${kpi.recoveryPercentage.toFixed(2)}%`
                  : '...',
              color: 'text-blue-600',
            },
            {
              label: 'Promises to Pay Today',
              value:
                typeof kpi?.promisesToPayToday === 'number'
                  ? `${kpi.promisesToPayToday} Debtor`
                  : '...',
              color: 'text-yellow-600',
            },
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
      )}

      {/* Today's Task List (Full Width) */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <TodaysTaskList />
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <CollectionPerformanceChart />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <PortfolioStatusChart />
        </div>
      </div>
    </MainLayout>
  )
}
