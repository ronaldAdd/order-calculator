import React from 'react'

type Debtor = {
  name: string
  amount: number
}

const debtors: Debtor[] = [
  { name: 'PT Maju Mundur', amount: 23000000 },
  { name: 'CV Sukses Terus', amount: 18500000 },
  { name: 'UD Karya Abadi', amount: 14200000 },
  { name: 'PT Sejahtera', amount: 11000000 },
  { name: 'CV Makmur Sentosa', amount: 9000000 },
]

const formatRupiah = (number: number) => {
  return `Rp ${number.toLocaleString('id-ID')}`
}

const TopDebtors: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md mt-8 max-w-sm mx-auto">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 text-center">
        Top 5 Debtors
      </h3>
      <ul>
        {debtors.map((debtor, idx) => (
          <li
            key={idx}
            className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-700"
          >
            <span className="text-gray-800 dark:text-gray-300">{debtor.name}</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {formatRupiah(debtor.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TopDebtors
