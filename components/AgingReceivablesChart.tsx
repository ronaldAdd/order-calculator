// components/AgingReceivablesChart.tsx
import React from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const data: ChartData<'pie'> = {
  labels: ['0-30 days', '31-60 days', '61-90 days', '>90 days'],
  datasets: [
    {
      label: 'Aging Receivables',
      data: [40, 25, 20, 15],
      backgroundColor: [
        'rgba(34, 197, 94, 0.7)',    // green
        'rgba(250, 204, 21, 0.7)',   // yellow
        'rgba(249, 115, 22, 0.7)',   // orange
        'rgba(239, 68, 68, 0.7)',    // red
      ],
      borderWidth: 1,
    },
  ],
}

const options: ChartOptions<'pie'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { size: 12 },
      },
    },
  },
}

const AgingReceivablesChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-8 max-w-sm mx-auto">
      <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3 text-center">
        Aging Receivables
      </h3>
      <Pie data={data} options={options} />
    </div>
  )
}

export default AgingReceivablesChart
