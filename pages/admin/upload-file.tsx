//FINAL - upload-file.tsx

'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import MainLayout from '../../components/MainLayout'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Pusher from 'pusher-js'
import ReactSelect from 'react-select'
import type { SingleValue } from 'react-select'
import reactSelectStyles from '@/lib/reactSelectStyles'
import { validateMappedDebtorZod } from '@/utils/validateMappedDebtorZod'
import useUserStore from '../../src/store/useUserStore'


interface MappingField {
  label: string
  value: string
  type?: string
}

interface UserOption {
  id: string
  name?: string
  email?: string
}

interface RowError {
  [rowIdx: string]: { [field: string]: string }
}

type TemplateType = {
  name: string;
  headers: string; // <- ini stringified JSON
  mapping: string; // <- ini stringified JSON
  createdAt?: string;
};

const convertErrorsToCSV = (rowErrors: RowError): string => {
  const rows: string[] = [];
  const allPayloadFields = new Set<string>();

  // Kumpulkan semua field dari payload
  Object.values(rowErrors).forEach((err) => {
    if (typeof err._payload === 'string') {
      try {
        const payloadObj = JSON.parse(err._payload);
        Object.keys(payloadObj).forEach((key) => allPayloadFields.add(key));
      } catch {}
    }
  });

  const payloadHeaders = Array.from(allPayloadFields);
  const headerRow = ['Row', 'Field', 'Message', ...payloadHeaders];
  rows.push(headerRow.join(','));

  Object.entries(rowErrors).forEach(([rowIdx, fields]) => {
    const rowNumber = +rowIdx + 2;
    const { _payload, ...errorFields } = fields;

    const payloadObj =
      typeof _payload === 'string'
        ? (() => {
            try {
              return JSON.parse(_payload);
            } catch {
              return {};
            }
          })()
        : {};

    Object.entries(errorFields).forEach(([field, message]) => {
      const payloadValues = payloadHeaders.map((k) => {
        const val = payloadObj[k];
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      });
      const safeMessage =
      typeof message === 'string' ? message.replace(/"/g, '""') : String(message).replace(/"/g, '""');
      const row = [`${rowNumber}`, `"${field}"`, `"${safeMessage}"`, ...payloadValues];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
};


export default function UploadExcelPage() {
  const [fileName, setFileName] = useState('')
  const [data, setData] = useState<string[][] | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [progress, setProgress] = useState(0)
  const [mappingFields, setMappingFields] = useState<MappingField[]>([])
  const [headerMapping, setHeaderMapping] = useState<{ [idx: number]: string }>({})
  const [saving, setSaving] = useState(false)
  const [rowErrors, setRowErrors] = useState<RowError>({})
  const [collectorOptions, setCollectorOptions] = useState<{ value: string; label: string }[]>([])
  const [assignedCollectors, setAssignedCollectors] = useState<{ [rowIdx: number]: string }>({})
  const [isValidated, setIsValidated] = useState(false)
  const [validatedData, setValidatedData] = useState<Record<string, unknown>[]>([])
  const [templateName, setTemplateName] = useState('')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [templatePage, setTemplatePage] = useState(1)
  const [templateLimit] = useState(5)
  const [templateTotalPages, setTemplateTotalPages] = useState(1)
  const [, setIsFetchingTemplate] = useState(false)
  const [forceRenderKey, setForceRenderKey] = useState(Date.now()) // untuk paksa rerender
  const [, setIsMappingFieldReady] = useState(false)
  const rowsPerPage = 10
  const [assignedSizes, setAssignedSizes] = useState<{ [rowIdx: number]: string }>({});
  const [sizeSummary, setSizeSummary] = useState<{ [key: string]: number }>({});
  const [qty, setQty] = useState(13);
  const [unitPrice, setUnitPrice] = useState(15.33);
  const [shipping, setShipping] = useState(114.00);
  const [verificationMsg, setVerificationMsg] = useState<string>("");
  const [paymentThru, setPaymentThru] = useState<string[]>([]);
  const user = useUserStore((state) => state.user)
  const [methods, setMethods] = useState<string[]>(['Cash', 'Bank Transfer', 'Zelle', 'Card']);
  const [newMethod, setNewMethod] = useState('');

  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [systemDate] = useState(() => new Date().toLocaleDateString());

  const [policyPrice, setPolicyPrice] = useState('');
  const [policyCode, setPolicyCode] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [isPolicyAgreed, setIsPolicyAgreed] = useState(false);  
  // Hitung price per unit (USD)
  const pricePerUnit = qty > 0 ? ((qty * unitPrice + shipping) / qty).toFixed(2) : '0.00';  

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const res = await fetch('/api/users/lists')
        const json = await res.json()
        const options = json.data.map((u: UserOption) => ({
          value: u.id,
          label: u.name || u.email || u.id
        }))
        setCollectorOptions(options)
      } catch  {
        toast.error('Gagal load data collector')
      }
    }
    fetchCollectors()
  }, [])


  useEffect(() => {
    let channel: ReturnType<Pusher['subscribe']> | null = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        })

        channel = pusher.subscribe(`progress-${user.uid}`)
        channel.bind('progress-update', (data: { progress: number }) => {
          setProgress(data.progress)
        })
      }
    })

    return () => {
      unsubAuth()
      if (channel) {
        channel.unbind_all()
        channel.unsubscribe()
      }
      Pusher.instances.forEach((instance) => instance.disconnect())
    }
  }, [])


  useEffect(() => {
    if (templateModalOpen) {
      fetchDebtorFields() // ⬅️ Tambahkan ini
      fetchTemplates(1)
    }
  }, [templateModalOpen])

  useEffect(() => {
    if (!data) return;

    const summary: Record<string, number> = {};

    // Ambil semua size dari data kolom "size"
    const sizeIdx = data[0]?.findIndex((h, idx) => headerMapping[idx] === 'size');
    if (sizeIdx !== -1 && sizeIdx !== undefined) {
      data.slice(1).forEach((row) => {
        const val = row[sizeIdx]?.trim();
        if (val) summary[val] = (summary[val] || 0) + 1;
      });
    }

    // Tambahkan dari assignedSizes juga (kalau kolom size belum ada)
    Object.values(assignedSizes).forEach((val) => {
      if (val) summary[val] = (summary[val] || 0) + 1;
    });

    setSizeSummary(summary);
  }, [data, assignedSizes, headerMapping]);


  // ✅ Reset assignedSizes kalau kolom "size" sudah dimapping
  useEffect(() => {
    const isSizeMapped = Object.values(headerMapping).includes('size');
    if (isSizeMapped && Object.keys(assignedSizes).length > 0) {
      setAssignedSizes({});
      toast.info('Kolom "size" sudah dipilih. Dropdown "Pilih Size" dikosongkan untuk mencegah duplikasi.');
    }
  }, [headerMapping]);

  // 🔍 Verifikasi kesesuaian antara QTY dan total distribusi size
  useEffect(() => {
    if (!qty || Object.keys(sizeSummary).length === 0) return;

    const distTotal = Object.values(sizeSummary).reduce((a, b) => a + b, 0);

    if (distTotal === qty) {
      setVerificationMsg(`✅ OK — ${distTotal} pieces total`);
    } else if (distTotal < qty) {
      setVerificationMsg(`⚠️ ${qty - distTotal} piece(s) missing`);
    } else {
      setVerificationMsg(`⚠️ ${distTotal - qty} piece(s) extra`);
    }
  }, [qty, sizeSummary]);



  const fetchDebtorFields = async () => {
    try {
      const res = await fetch('/api/debtors/fields')
      const json = await res.json()
      setMappingFields(json.fields)
      setIsMappingFieldReady(true)
    } catch {
      toast.error('Gagal mengambil field mapping dari server')
    }
  }

  const cleanParsedData = (parsed: (string | number | null | undefined)[][]): string[][] => {
    if (!parsed || parsed.length === 0) return []

    const colLength = parsed.reduce((max, row) => Math.max(max, row?.length || 0), 0)

    const cleanedRows = parsed.map((row = []) => {
      const normalized = [...row]
      while (normalized.length < colLength) normalized.push('')
      return normalized.map((cell) => (typeof cell === 'number' ? cell.toString() : (cell ?? '').toString()))
    })

    return cleanedRows
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!['xls', 'xlsx', 'csv'].includes(fileExtension || '') || !validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an XLSX or CSV file.')
      e.target.value = '' // reset input file
      return
    }

    // ✅ Reset semua yang terkait template
    setHeaderMapping({})
    setForceRenderKey(Date.now())
    setRowErrors({}) // 🔥 Ini akan menghapus semua isi Validation Log
    setIsValidated(false)
    setValidatedData([])

    setFileName(file.name)
    setData(null)
    setCurrentPage(1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const input = e.currentTarget.querySelector('input[type=file]') as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      toast.error('Pilih file dulu ya!')
      return
    }

    const file = input.files[0]
    setLoading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-pusher', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload gagal')
      }

      const json = await res.json()
      
      setData(cleanParsedData(json.data))
      toast.success('File uploaded and parsed successfully!')
      fetchDebtorFields()
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message)
      else toast.error('Unknown error.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteColumn = (colIdx: number) => {
    if (!data) return
    const newData = data.map((row) => {
      const newRow = [...row]
      newRow.splice(colIdx, 1)
      return newRow
    })
    setData(newData)
  }

  const handleDeleteRow = (rowIdx: number) => {
    if (!data) return
    const newData = [...data]
    newData.splice(rowIdx + 1, 1)
    setData(newData)
  }


  const handleSaveMappingAndInsert = async () => {

    // return console.log(validatedData,'handleSaveMappingAndInsert');
    
    
    if (!validatedData || validatedData.length === 0) {
      toast.error('⛔ Data belum divalidasi. Jalankan "Row Level Validation" dulu.')
      return
    }

    setSaving(true)
    setProgress(0)

    let successCount = 0
    let failCount = 0
    const backendErrors: RowError = {}

    for (let i = 0; i < validatedData.length; i++) {
      try {
        const res = await fetch('/api/debtors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData[i]),
        })

        if (!res.ok) {
          const err = await res.json()
          const field = err.field || '_error'
          const message = err.message || 'Gagal menyimpan data'
          const value = err.value || ''
          const payload = err.payload || validatedData[i]

          backendErrors[i] = {
            [field]: `${message}. Value: ${value}`,
            _payload: JSON.stringify(payload),
          }

          throw new Error(message)
        }

        successCount++
      } catch {
        failCount++
      }

      const progress = Math.floor(((i + 1) / validatedData.length) * 100)
      setProgress(progress)
    }

    setSaving(false)
    setProgress(100)

    if (Object.keys(backendErrors).length > 0) {
      setRowErrors(backendErrors)
      toast.error(`${failCount} dari ${validatedData.length} baris gagal disimpan.`)
    } else {
      setRowErrors({})
      toast.success(`✅ Semua ${successCount} baris berhasil disimpan ke database`)
    }
  }


  const paginatedData = data
    ? [data[0], ...data.slice(1).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)]
    : null

  const totalPages = data ? Math.ceil((data.length - 1) / rowsPerPage) : 0


  const handleCollectorChange = (rowIdx: number, value: string) => {
    setAssignedCollectors(prev => ({ ...prev, [rowIdx]: value }))
  }


  const handleValidateRows = () => {
    if (!data) {
      console.log('⛔ Tidak ada data untuk divalidasi')
      return
    }

    const rows = data.slice(1) // skip header
    console.log(`📄 Total data rows: ${rows.length}`,rows)

    const cleanNumber = (val: string): number => {
      if (!val) return 0;

      // Hilangkan Rp, spasi, dan karakter selain angka, titik, koma
      let cleaned = val.replace(/Rp|\s/g, '').replace(/[^\d.,-]/g, '');

      // Format: 5.450.000,50 => ID style
      if (cleaned.match(/\.\d{3},\d{1,2}$/)) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
      // Format: 5,450,000.50 => US style
      else if (cleaned.match(/,\d{3}\.\d{1,2}$/)) {
        cleaned = cleaned.replace(/,/g, '');
      }
      // Format: 5.450.000 => only ribuan ID style
      else if (cleaned.match(/\.\d{3}$/)) {
        cleaned = cleaned.replace(/\./g, '');
      }
      // Format: 5,450,000 => only ribuan US style
      else if (cleaned.match(/,\d{3}$/)) {
        cleaned = cleaned.replace(/,/g, '');
      }

      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const normalizeDateString = (val: string): string => {
      if (!val) return val;

      const trimmed = val.trim();

      // Format: 10/06/2025 (DD/MM/YYYY)
      const slashParts = trimmed.split('/');
      if (slashParts.length === 3) {
        const [dd, mm, yyyy] = slashParts;
        if (dd.length <= 2 && mm.length <= 2 && yyyy.length === 4) {
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
      }

      // Format umum lain seperti "10-Jun-2025" atau "June 10, 2025"
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0'); // bulan 0-11
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }

      // fallback: return as is (biar Zod errorin kalau salah)
      return val;
    };


    const parseJsonOrArray = (val: string): unknown => {
      const trimmed = val.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed)
        } catch {
          return val
        }
      }
      return val.split(',').map((v) => v.trim())
    }

    const mappedData = rows.map((row, i) => {
      const obj: Record<string, unknown> = {}

      row.forEach((val, j) => {
        const field = headerMapping[j]
        if (!field) return

        const fieldType = mappingFields.find((f) => f.value === field)?.type
        
        try {
          if (fieldType === 'DECIMAL' || fieldType === 'INTEGER') {
            obj[field] = cleanNumber(val)
          } else if (fieldType === 'JSON') {
            obj[field] = parseJsonOrArray(val)
          } else if (fieldType === 'DATEONLY') {
            obj[field] = normalizeDateString(val)            
          } else {
            obj[field] = val?.trim?.() ?? ''
          }
        } catch {
          obj[field] = val
        }
      })

      if (assignedCollectors[i]) {
        obj['assignedCollector'] = assignedCollectors[i]
      }

      return obj
    })

    const allErrors: RowError = {}
    const validRows: Record<string, unknown>[] = [];
    mappedData.forEach((row, idx) => {

      // Ubah flat key jadi nested object sesuai prefix
      const transformedRow: Record<string, unknown> = {}

      Object.entries(row).forEach(([key, value]) => {
        if (key.startsWith("BankAccounts.")) {
          const subKey = key.replace("BankAccounts.", "")
          if (!Array.isArray(transformedRow.BankAccounts)) {
            (transformedRow as Record<string, unknown>)["BankAccounts"] = [{} as Record<string, unknown>]
          }
          const bankAccounts = transformedRow.BankAccounts as Record<string, unknown>[]
          bankAccounts[0][subKey] = value
        } else if (key.startsWith("Relations.")) {
          const subKey = key.replace("Relations.", "")
          if (!Array.isArray(transformedRow.Relations)) {
            (transformedRow as Record<string, unknown>)["Relations"] = [{} as Record<string, unknown>]
          }
          const relations = transformedRow.Relations as Record<string, unknown>[]
          relations[0][subKey] = value
        } else {
          transformedRow[key] = value
        }
      })      
      // console.log(transformedRow,'DATAS');
  
      const result = validateMappedDebtorZod(transformedRow)
      
      if (!result.success && result.error) {
        allErrors[idx] = result.error
        console.warn(`❌ Error on row ${idx + 2}:`, result.error)
      } else {
        if (result.data) {
          validRows.push(result.data);
        }        
        console.log(`✅ row ${idx + 2} valid`)
      }
    })


    if (Object.keys(allErrors).length > 0) {
      setIsValidated(false)
      setRowErrors(allErrors)
      toast.error(`❌ Validation failed on ${Object.keys(allErrors).length} row(s). Check the console or error panel for details.`)
      console.error('📛 Semua error:', allErrors)
      return
    }
    setRowErrors({})
    setIsValidated(true)
    setValidatedData(validRows)
    toast.success('Semua baris valid ✅')
    console.log('🎉 Semua baris lolos validasi')
  }

  const handleResetCollectors = () => {
    setAssignedCollectors({})
    toast.info('All assigned collectors have been reset.')
  }

  const handleDownloadErrorReport = () => {
  const csvContent = convertErrorsToCSV(rowErrors);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'validation_error_report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  };


  const handleSaveTemplate = async () => {
    if (!data || !data.length || Object.keys(headerMapping).length === 0) {
      toast.error('⛔ Tidak ada data atau mapping header belum lengkap.')
      return
    }

    if (!templateName.trim()) {
      toast.error('📝 Isi nama template dulu.')
      return
    }

    const payload = {
      name: templateName,
      headers: data[0], // baris pertama sebagai headers
      mapping: headerMapping,
    }

    try {
      const res = await fetch('/api/ingestion-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Gagal menyimpan template')
      }

      toast.success('Template berhasil disimpan ✅')
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan template ❌')
    }
  }

  //handleApplyTemplate
  const handleApplyTemplate = (tpl: TemplateType) => {
    if (mappingFields.length === 0 || !data || !data.length) {
      toast.error("❌ Field mapping is not ready or data hasn't been uploaded.");
      return;
    }

    let templateHeaders: string[] = [];
    let templateMapping: { [idx: number]: string } = {};

    try {
      templateHeaders = Array.isArray(tpl.headers)
        ? tpl.headers
        : JSON.parse(tpl.headers);

      templateMapping =
        typeof tpl.mapping === 'object'
          ? tpl.mapping
          : JSON.parse(tpl.mapping);

    } catch (err) {
      toast.error("❌ Failed to read template data.");
      console.error("Parsing error:", err);
      return;
    }

    const currentHeaders = data[0];
    const isHeaderMatch =
      templateHeaders.length === currentHeaders.length &&
      templateHeaders.every((h, i) => h === currentHeaders[i]);

    if (!isHeaderMatch) {
      const diffs: string[] = [];
      const maxLen = Math.max(templateHeaders.length, currentHeaders.length);
      for (let i = 0; i < maxLen; i++) {
        const expected = templateHeaders[i] ?? "<empty>";
        const actual = currentHeaders[i] ?? "<empty>";
        if (expected !== actual) {
          diffs.push(`Column ${i + 1}: "${actual}" ≠ "${expected}"`);
        }
      }

      // 🔥 Add to Validation Log
      setRowErrors((prev) => ({
        ...prev,
        ['template']: {
          templateMismatch: `❌ Template doesn't match the uploaded file.\n\nHeader Differences:\n${diffs.join('\n')}`,
        },
      }));

      toast.error("❌ Template mismatch. See details in Validation Log.");
      console.error("Header Mismatch:", diffs);
      setTemplateModalOpen(false);
      return;
    }

    const templateFields = Object.values(templateMapping).filter(Boolean);
    const validFields = mappingFields.map((f) => f.value);
    const isValid = templateFields.every((f) => f === "" || validFields.includes(f));

    if (!isValid) {
      toast.error("⚠️ Fields in the template do not match available fields.");
      return;
    }

    // 🧹 Clean previous logs (template & success)
    setRowErrors((prev) => {
      const cleaned = { ...prev };
      delete cleaned['template'];
      delete cleaned['template-success'];
      return cleaned;
    });

    // ✅ Apply template
    setHeaderMapping({});
    setTimeout(() => {
      setHeaderMapping({ ...templateMapping });
      setForceRenderKey(Date.now());
    }, 10);

    setTemplateModalOpen(false);
    toast.success(`✅ Template "${tpl.name}" applied successfully.`);

    // 🔄 Add success message to Validation Log
    setRowErrors((prev) => ({
      ...prev,
      ['template-success']: {
        applied: `✅ Template "${tpl.name}" applied successfully.`,
      },
    }));
  };

  const fetchTemplates = async (page = 1) => {
    try {
      setIsFetchingTemplate(true)
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/ingestion-template?page=${page}&limit=${templateLimit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Gagal mengambil data template')

      const json = await res.json()
      setTemplates(json.data)
      setTemplatePage(json.pagination.page)
      setTemplateTotalPages(json.pagination.totalPages)
    } catch (error) {
      toast.error('Gagal memuat template.')
      console.error(error)
    } finally {
      setIsFetchingTemplate(false)
    }
  }


  return (
    <MainLayout title="Upload File Excel">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Upload File Excel (.xlsx) / CSV</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xl mx-auto">
        <input
          type="file"
          accept=".xls,.xlsx,.csv"
          onChange={handleFileChange}
          className="mb-4 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          disabled={loading}
          required
        />
        {fileName && <p className="mb-4 text-gray-700 dark:text-gray-300">Selected file: <strong>{fileName}</strong></p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Processing...</span> : 'Upload & Parse'}
        </button>
        {(loading || saving) && (
          <div className="mt-4">
            <p className="mb-1 text-gray-600 dark:text-gray-300">Progress: {progress}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded h-3">
              <div className="bg-green-600 h-3 rounded transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </form>

      {/* ✅ PAYMENT THRU SECTION */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mt-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          💳 Payment Thru
        </h2>

        {/* Input Preparer */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preparer
          </label>
          <input
            type="text"
            value={user?.name || ''}
            readOnly
            className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Checkbox group */}
        <div className="text-gray-800 dark:text-gray-100">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Methods
          </label>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-6 gap-y-3">
            {methods.map((method) => (
              <label key={method} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={method}
                  checked={paymentThru.includes(method)}
                  onChange={(e) => {
                    const { value, checked } = e.target;
                    setPaymentThru((prev) =>
                      checked ? [...prev, value] : prev.filter((m) => m !== value)
                    );
                  }}
                  className="w-5 h-5 accent-blue-600"
                />
                <span>{method}</span>
              </label>
            ))}
          </div>

          {/* Tambah custom method */}
          <div className="mt-4 flex space-x-2">
            <input
              type="text"
              placeholder="Add custom payment method..."
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              className="flex-1 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => {
                if (
                  newMethod.trim() &&
                  !methods.includes(newMethod.trim())
                ) {
                  setMethods((prev) => [...prev, newMethod.trim()]);
                  setNewMethod('');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* tampilkan hasil pilihan */}
        {paymentThru.length > 0 ? (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Selected:</span>{' '}
            {paymentThru.join(', ')}
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No payment method selected.
          </div>
        )}
      </div>


{/* ✅ PRODUCT INFORMATION FORM */}
<div className="bg-white dark:bg-gray-800 p-6 rounded shadow mt-8 max-w-2xl mx-auto">
  <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
    🧾 Product Information
  </h2>

  {/* Product Code */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Product Code
    </label>
    <input
      type="text"
      value={productCode}
      onChange={(e) => setProductCode(e.target.value)}
      placeholder="Enter product code"
      className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
    />
  </div>

  {/* Product Name */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Product Name
    </label>
    <input
      type="text"
      value={productName}
      onChange={(e) => setProductName(e.target.value)}
      placeholder="Enter product name"
      className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
    />
  </div>

  {/* Department Name */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Department Name
    </label>
    <input
      type="text"
      value={departmentName}
      onChange={(e) => setDepartmentName(e.target.value)}
      placeholder="Enter department name"
      className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
    />
  </div>

  {/* Project Name */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Project Name
    </label>
    <input
      type="text"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      placeholder="Enter project name"
      className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
    />
  </div>

  {/* System Date */}
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      System Date
    </label>
    <input
      type="text"
      value={systemDate}
      readOnly
      className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
    />
  </div>
</div>



      {/* ✅ PRICE CALCULATION FORM */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mt-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          💰 Price Calculation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              QTY (Pieces)
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit Price (USD/PC)
            </label>
            <input
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shipping (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={shipping}
              onChange={(e) => setShipping(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
        </div>

        {/* hasil perhitungan */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-300 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="border px-3 py-2">QTY(Pieces)</th>
                <th className="border px-3 py-2">USD/PC</th>
                <th className="border px-3 py-2">Amount(USD)</th>
                <th className="border px-3 py-2">Shipping(USD)</th>
                <th className="border px-3 py-2">Total(USD)</th>
                <th className="border px-3 py-2">Price(USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center text-gray-800 dark:text-gray-100">
                <td className="border px-3 py-2">{qty}</td>
                <td className="border px-3 py-2">${unitPrice.toFixed(2)}</td>
                <td className="border px-3 py-2">${(qty * unitPrice).toFixed(2)}</td>
                <td className="border px-3 py-2">${shipping.toFixed(2)}</td>
                <td className="border px-3 py-2">
                  ${(qty * unitPrice + shipping).toFixed(2)}
                </td>
                <td className="border px-3 py-2">
                  {qty > 0 ? `$${((qty * unitPrice + shipping) / qty).toFixed(2)}` : '$0.00'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
{/* ✅ Verification Section */}
<div className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-100">
  <div className="flex items-center space-x-2">
    <span className="font-semibold">Verification:</span>
    <span
      className={
        verificationMsg.includes("OK")
          ? "text-green-600 dark:text-green-400"
          : "text-yellow-600 dark:text-yellow-400"
      }
    >
      {verificationMsg || "—"}
    </span>
  </div>
</div>

      </div>


      {/* ✅ POLICY ACKNOWLEDGMENT FORM */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mt-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          📋 Uniform Policy Acknowledgment Worksheet
        </h2>

        {/* Agreement Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          By signing this worksheet, you agree to the following terms:
        </p>

{/* Price (USD) - ambil dari hasil price per unit (Price Calculation table) */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Price (USD)
  </label>
  <input
    type="text"
    value={`$${pricePerUnit}`}
    readOnly
    className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
  />
</div>


        {/* Payable To - otomatis dari user / form sebelumnya */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payable To
          </label>
          <input
            type="text"
            value={user?.name || ''}
            readOnly
            className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Payment Thru - otomatis tampil dari form Payment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Thru
          </label>
          <input
            type="text"
            value={paymentThru.join(', ') || 'No payment method selected'}
            readOnly
            className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Policy Document Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Policy Document Code
            </label>
            <input
              type="text"
              value={policyCode}
              onChange={(e) => setPolicyCode(e.target.value)}
              placeholder="e.g., MTOPS001"
              className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Policy Document Name
            </label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="e.g., Media Team Uniform Policy"
              className="w-full rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-start space-x-2 mt-2">
          <input
            type="checkbox"
            checked={isPolicyAgreed}
            onChange={(e) => setIsPolicyAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-green-600"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            I understand and accept the Policy as described above and agree to comply
            with its requirements at all times while serving.
          </p>
        </div>

        {/* System Date */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Date
          </label>
          <input
            type="text"
            value={systemDate}
            readOnly
            className="w-full rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100"
          />
        </div>
      </div>



      {paginatedData && (
        <>
          <div className="overflow-auto w-full max-h-[70vh] mt-8 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">


            <table className="min-w-full text-base text-left border-collapse border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                <tr>
                  {paginatedData[0].map((originalHeader, idx) => {
                    const mappedField = mappingFields.find(f => f.value === headerMapping[idx])
                    return (
                      <th key={idx} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold relative">
                        <div className="mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">{originalHeader}</div>
                        <select
                          key={`select-${forceRenderKey}-${idx}`} // 🔥 GANTI INI
                          value={headerMapping[idx] || ''}
                          onChange={(e) => setHeaderMapping((prev) => ({ ...prev, [idx]: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Choose Field --</option>
                          {mappingFields
                            .filter((field) => {
                              // Ambil semua field yang sudah dipilih
                              const usedFields = Object.values(headerMapping);
                              // Boleh muncul kalau:
                              // 1. Field belum dipilih di kolom lain, atau
                              // 2. Field ini sedang digunakan oleh kolom ini sendiri
                              return !usedFields.includes(field.value) || headerMapping[idx] === field.value;
                            })
                            .map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}

                        </select>
                        {mappedField?.type && (
                          <div className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">{mappedField.type}</div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(idx)}
                          className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold text-lg"
                          title="Hapus kolom"
                        >
                          &times;
                        </button>
                      </th>
                    )
                  })}
                  {/* ✅ Tampilkan kolom Assigned Size hanya jika kolom "size" belum ada */}
                  {!Object.values(headerMapping).includes('size') && (
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold">
                      Pilih Size
                    </th>
                  )}
                </tr>
              </thead>
<tbody>
  {paginatedData.slice(1).map((row, rowIdx) => {
    const globalRowIdx = (currentPage - 1) * rowsPerPage + rowIdx
    return (
      <tr
        key={rowIdx}
        className={
          rowIdx % 2 === 0
            ? 'bg-gray-50 dark:bg-gray-800'
            : 'bg-white dark:bg-gray-900'
        }
      >
        {row.map((cell, cellIdx) => {
          const field = headerMapping[cellIdx]
          const isError = rowErrors[globalRowIdx]?.[field]

          // ✅ Jika kolom bernama "size", tampilkan dropdown pilihan ukuran
          if (field === 'size') {
            const sizeOptions = ['2XL', 'XL', 'L', 'M', 'S']
            return (
              <td
                key={cellIdx}
                className={`border px-6 py-3 ${
                  isError
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                title={isError ? rowErrors[globalRowIdx][field] : ''}
              >
                <select
                  value={cell || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setData((prev) => {
                      if (!prev) return prev
                      const updated = [...prev]
                      updated[globalRowIdx + 1][cellIdx] = newValue // +1 karena header
                      return updated
                    })
                  }}
                  className="w-full px-2 py-1 rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                >
                  <option value="">-- pilih ukuran --</option>
                  {sizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </td>
            )
          }

          // 🧩 default cell rendering
          return (
            <td
              key={cellIdx}
              className={`border px-6 py-3 ${
                isError
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              title={isError ? rowErrors[globalRowIdx][field] : ''}
            >
              {cell || ''}
            </td>
          )
        })}

        {/* ✅ Tampilkan dropdown Assign Size kalau kolom "size" belum dimapping */}
        {!Object.values(headerMapping).includes('size') && (
          <td className="border px-4 py-2">
            <select
              value={assignedSizes[globalRowIdx] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setAssignedSizes((prev) => ({ ...prev, [globalRowIdx]: val }));
              }}
              className="w-full px-2 py-1 rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">-- pilih ukuran --</option>
              {['2XL', 'XL', 'L', 'M', 'S'].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </td>
        )}


        {/* 🗑 Tombol hapus baris */}
        <td className="border px-4 py-2 text-center">
          <button
            onClick={() => handleDeleteRow(globalRowIdx)}
            className="text-red-600 hover:text-red-800 font-bold"
            title="Hapus baris ini"
          >
            &times;
          </button>
        </td>
      </tr>
    )
  })}
</tbody>

            </table>
          </div>

          <div className="flex justify-center items-center mt-4 space-x-4 text-gray-700 dark:text-gray-300">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {Object.keys(sizeSummary).length > 0 && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100">
              <h3 className="font-semibold mb-3 text-lg">📦 Size Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(sizeSummary).map(([size, count]) => (
                  <div
                    key={size}
                    className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-3 text-center border border-gray-300 dark:border-gray-600"
                  >
                    <div className="text-sm font-semibold">{size}</div>
                    <div className="text-gray-600 dark:text-gray-300">{count} pcs</div>
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="mt-6 grid grid-cols-12 gap-4 items-start">
            {/* KIRI: Console Output (selalu muncul) */}
            <div className="col-span-12 md:col-span-10 bg-black text-white font-mono text-sm p-4 rounded max-h-80 overflow-y-auto border border-gray-700">
              {Object.keys(rowErrors).length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Download Error Report
                  </button>
                </div>
              )}

              <div className="text-yellow-400 font-bold mb-2">📋 Validation Log:</div>
              {/* 🛑 Munculin error template jika header tidak cocok */}
              {rowErrors['template'] && (
                <div className="text-red-300 mb-4 whitespace-pre-wrap">
                  {rowErrors['template'].templateMismatch}
                </div>
              )}

              {Object.keys(rowErrors).length === 0 ? (
                <div className="text-green-400">✅ Tidak ada error validasi. Semua baris valid.</div>
              ) : (
                Object.entries(rowErrors).map(([rowIdx, fieldErrors]) => (
                  <div key={rowIdx} className="text-red-400 mb-2">
                    ❌ Row {+rowIdx + 2}:
                    {Object.entries(fieldErrors).map(([field, message]) => (
                      <div key={field} className="pl-4">
                        <code>{field}</code>:  {String(message)}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* KANAN: Tombol-tombol aksi */}
            <div className="col-span-12 md:col-span-2 flex flex-col space-y-2">


              {/* <button
                onClick={handleValidateRows}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Row Level Validation
              </button> */}

              {/* <button
                onClick={handleSaveMappingAndInsert}
                disabled={!isValidated || saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Commit to Database'
                )}
              </button> */}



            </div>
          </div>

        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} />

    {templateModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">📂 Select Template Mapping</h2>

            {templates.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">There are no available templates.</p>
            ) : (
              <>
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                  {templates.map((tpl, idx) => {
                    let mappingObj: Record<string, string> = {};
                    let headersArr: string[] = [];

                      if (typeof tpl.mapping === 'object') {
                        mappingObj = tpl.mapping;
                      } else {
                        try {
                          mappingObj = JSON.parse(tpl.mapping);
                        } catch {
                          mappingObj = {};
                        }
                      }


                    if (Array.isArray(tpl.headers)) {
                      headersArr = tpl.headers;
                    } else {
                      try {
                        headersArr = JSON.parse(tpl.headers);
                      } catch {
                        headersArr = [];
                      }
                    }


                    const mappedFields = Object.values(mappingObj).filter((v) => v !== '');

                    return (
                      <li
                        key={idx}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => handleApplyTemplate(tpl)}
                      >
                        <div className="font-semibold">{tpl.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created at: {tpl.createdAt ? new Date(tpl.createdAt).toLocaleString() : 'N/A'}
                        </div>

                        {/* ✅ Header info */}
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                          <span className="font-medium">Headers ({headersArr.length}):</span>{' '}
                          {headersArr.slice(0, 6).join(', ')}{headersArr.length > 6 ? ', ...' : ''}
                        </div>

                        {/* ✅ Mapped field info */}
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                          <span className="font-medium">Mapped Fields ({mappedFields.length}):</span>{' '}
                          {mappedFields.slice(0, 6).join(', ')}{mappedFields.length > 6 ? ', ...' : ''}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {/* Pagination control */}
                <div className="flex justify-between items-center mt-4 text-sm">
                  <button
                    onClick={() => fetchTemplates(templatePage - 1)}
                    disabled={templatePage === 1}
                    className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-gray-700 dark:text-gray-200">
                    Page {templatePage} of {templateTotalPages}
                  </span>
                  <button
                    onClick={() => fetchTemplates(templatePage + 1)}
                    disabled={templatePage === templateTotalPages}
                    className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}


          <div className="flex justify-end mt-6">
            <button
              onClick={() => setTemplateModalOpen(false)}            
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ✖️ Close
            </button>
          </div>
        </div>
      </div>
    )}

    </MainLayout>
  )
}
