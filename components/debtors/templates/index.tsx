'use client'

import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import MainLayout from "@/components/MainLayout"

type Field = {
  value: string
  label: string
  type: string
}

export default function DebtorTemplatePage() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/debtors/fields')
        const data = await res.json()
        setFields(data.fields || [])
      } catch (err) {
        console.error('Failed to fetch fields:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFields()
  }, [])

  const handleDownload = () => {
    if (!fields.length) return

    // Buat header kolom dari .value
    const headers = fields.map((f) => f.value)
    const worksheet = XLSX.utils.json_to_sheet([], { header: headers })

    // Tampilkan label kolom di baris pertama
    fields.forEach((field, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index })
      worksheet[cellRef] = { t: 's', v: field.label }
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "DebtorTemplate")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
    saveAs(blob, "DebtorTemplate.xlsx")
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">Download Template Excel Debtor</h1>
        <p className="mb-4">
          This page allows you to download an Excel template based on the current column structure of the Debtor data.
        </p>

        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleDownload}
          disabled={loading || !fields.length}
        >
          {loading ? "Loading..." : "Download Template Excel"}
        </button>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Column List</h2>
          <ul className="list-disc pl-6">
            {fields.map((field) => (
              <li key={field.value}>
                <strong>{field.label}</strong> <span className="text-sm text-gray-500">({field.value})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
