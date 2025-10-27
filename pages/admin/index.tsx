'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import CollectionPerformanceChart from '@/components/CollectionPerformanceChart'
import PortfolioStatusChart from '@/components/PortfolioStatusChart'
import TopPerformingCollectors from '@/components/TopPerformingCollectors'
import DebtAgingHistogramChart from '@/components/DebtAgingHistogramChart'
import Spinner from '@/components/Spinner'

import TodaysTaskList from '@/components/TodaysTaskList'


import {
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaChartLine,
  FaRegClock,
} from 'react-icons/fa'

export default function DashboardHome() {
  const [totalOutstanding, setTotalOutstanding] = useState<number | null>(null)
  const [collected, setCollected] = useState<number | null>(null)
  const [recoveryPercentage, setRecoveryPercentage] = useState<number | null>(null)
  const [promisesToPayToday, setPromisesToPayToday] = useState<number | null>(null)

  const [loadingOutstanding, setLoadingOutstanding] = useState(true)
  const [loadingCollected, setLoadingCollected] = useState(true)
  const [loadingRecovery, setLoadingRecovery] = useState(true)
  const [loadingPromise, setLoadingPromise] = useState(true)


  return (
    <MainLayout>
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        📊 Dashboard Overview
      </h2>

      {/* KPI Cards */}

      {/* Main Charts */}

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        </div>
      </div>
    </MainLayout>
  )
}
