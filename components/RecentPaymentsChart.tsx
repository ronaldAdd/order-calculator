import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const data = [
  { name: 'Jun 20', amount: 4000000 },
  { name: 'Jun 21', amount: 2500000 },
  { name: 'Jun 22', amount: 4500000 },
  { name: 'Jun 23', amount: 3000000 },
  { name: 'Jun 24', amount: 5000000 },
]

const formatRupiah = (num: number) =>
  `Rp ${num.toLocaleString('id-ID')}`

const RecentPaymentsChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md max-w-full">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 text-center">
        Recent Payments (Bar Chart)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 30, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            tickFormatter={(value) =>
              `Rp${(value / 1000000).toFixed(0)}M`
            }
          />
          <Tooltip formatter={(value: number) => formatRupiah(value)} />
          <Bar dataKey="amount" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RecentPaymentsChart
