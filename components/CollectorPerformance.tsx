import React from 'react'

type Collector = {
  name: string
  visits: number
  collectedAmount: number
}

const collectors: Collector[] = [
  { name: 'Andi', visits: 15, collectedAmount: 12000000 },
  { name: 'Siti', visits: 10, collectedAmount: 7000000 },
  { name: 'Budi', visits: 12, collectedAmount: 9000000 },
]

const formatRupiah = (number: number) => {
  return `Rp ${number.toLocaleString('id-ID')}`
}

const CollectorPerformance: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mt-8 max-w-md mx-auto">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 text-center">
        Collector Performance
      </h3>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="py-1 text-gray-700 dark:text-gray-300">Collector</th>
            <th className="py-1 text-gray-700 dark:text-gray-300">Visits</th>
            <th className="py-1 text-gray-700 dark:text-gray-300">Collected Amount</th>
          </tr>
        </thead>
        <tbody>
          {collectors.map((collector, idx) => (
            <tr key={idx} className="border-t border-gray-300 dark:border-gray-700">
              <td className="py-1 text-gray-800 dark:text-gray-200">{collector.name}</td>
              <td className="py-1 text-gray-800 dark:text-gray-200">{collector.visits}</td>
              <td className="py-1 font-semibold text-green-600 dark:text-green-400">
                {formatRupiah(collector.collectedAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CollectorPerformance
