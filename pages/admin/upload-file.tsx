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
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'



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

  const handleSaveToConsole = () => {
    if (!data || data.length === 0) {
      toast.error("⚠️ Tidak ada data tabel yang bisa disimpan.");
      return;
    }

    // Ambil header kolom (baris pertama)
    const headers = data[0];

    // Buat array data dari tabel
    const tableRows = data.slice(1).map((row, rowIdx) => {
      const rowObj: Record<string, string> = {};

      row.forEach((cell, cellIdx) => {
        const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
        rowObj[mappedField] = cell;
      });

      // Kalau kolom "size" belum dimapping, tambahkan dari assignedSizes
      if (!Object.values(headerMapping).includes("size")) {
        rowObj["size"] = assignedSizes[rowIdx] || "";
      }

      return rowObj;
    });

    const payload = {
      preparer: user?.name || "Unknown Preparer",
      uid: user?.uid || "Unknown Preparer",
      payableTo: user?.name || "Unknown Payee",

      productInfo: {
        productCode,
        productName,
        departmentName,
        projectName,
        systemDate,
      },
      paymentInfo: {
        paymentThru,
        methods,
      },
      priceCalculation: {
        qty,
        unitPrice,
        shipping,
        pricePerUnit,
      },
      policyAcknowledgment: {
        policyCode,
        policyName,
        policyPrice: pricePerUnit,
        isPolicyAgreed,
        systemDate,
      },
      sizeSummary,
      tableData: tableRows,
    };

    console.log("💾 Data to be saved:", payload);
    toast.success("✅ Semua data berhasil disimpan ke console log!");
  };


  const handleExportToPDF_ORI = async () => {
    if (!data || data.length === 0) {
      toast.error("⚠️ Tidak ada data tabel untuk diexport.");
      return;
    }

    const headers = data[0];
    const tableRows = data.slice(1).map((row, rowIdx) => {
      const rowObj: Record<string, string> = {};
      row.forEach((cell, cellIdx) => {
        const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
        rowObj[mappedField] = cell;
      });
      if (!Object.values(headerMapping).includes("size")) {
        rowObj["size"] = assignedSizes[rowIdx] || "";
      }
      return rowObj;
    });

    const payload = {
      preparer: user?.name || "Unknown Preparer",
      payableTo: user?.name || "Unknown Payee",
      productInfo: { productCode, productName, departmentName, projectName, systemDate },
      paymentInfo: { paymentThru, methods },
      priceCalculation: { qty, unitPrice, shipping, pricePerUnit },
      policyAcknowledgment: {
        policyCode,
        policyName,
        policyPrice: pricePerUnit,
        isPolicyAgreed,
        systemDate,
      },
      sizeSummary,
      tableData: tableRows,
    };

    // 🧾 Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 60;
    const marginX = 50;

    const drawTitle = (text: string) => {
      page.drawText(text, {
        x: marginX,
        y,
        size: 18,
        font: bold,
        color: rgb(0.1, 0.1, 0.5),
      });
      y -= 25;
    };

    const drawSection = (title: string) => {
      page.drawText(title, {
        x: marginX,
        y,
        size: 13,
        font: bold,
        color: rgb(0, 0, 0),
      });
      y -= 15;
    };

    const drawText = (text: string) => {
      page.drawText(text, {
        x: marginX + 15,
        y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 14;
    };

    // ---------- CONTENT ----------
    drawTitle("Uniform Policy Summary");

    drawSection("General Info");
    drawText(`Preparer: ${payload.preparer}`);
    drawText(`Payable To: ${payload.payableTo}`);
    y -= 6;

    drawSection("Product Information");
    Object.entries(payload.productInfo).forEach(([k, v]) => drawText(`${k}: ${v}`));
    y -= 6;

    drawSection("Payment Thru");
    drawText(payload.paymentInfo.paymentThru.join(", ") || "-");
    y -= 6;

    drawSection("Price Calculation");
    drawText(`Quantity: ${qty}`);
    drawText(`Unit Price: $${unitPrice.toFixed(2)}`);
    drawText(`Shipping: $${shipping.toFixed(2)}`);
    drawText(`Price/Unit: $${pricePerUnit}`);
    y -= 6;

    drawSection("Policy Acknowledgment");
    Object.entries(payload.policyAcknowledgment).forEach(([k, v]) =>
      drawText(`${k}: ${v}`)
    );
    y -= 6;

    drawSection("Size Summary");
    Object.entries(payload.sizeSummary).forEach(([size, count]) =>
      drawText(`${size}: ${count} pcs`)
    );
    y -= 10;

    drawSection("Table Data");

    // ---------- Table ----------
    const startY = y;
    const colWidths = [150, 150, 100]; // adjust depending on how many cols
    const tableHeader = Object.keys(payload.tableData[0] || {});
    const rowHeight = 14;

    // Header background
    page.drawRectangle({
      x: marginX,
      y: startY - 4,
      width: width - 2 * marginX,
      height: rowHeight + 4,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Draw table header
    let x = marginX;
    tableHeader.forEach((h, i) => {
      page.drawText(h, { x: x + 4, y: startY, size: 10.5, font: bold });
      x += colWidths[i] ?? 120;
    });
    y = startY - rowHeight - 8;

    // Rows
    payload.tableData.forEach((row, rowIdx) => {
      x = marginX;
      const rowValues = Object.values(row);
      rowValues.forEach((val, i) => {
        page.drawText(String(val).slice(0, 25), {
          x: x + 4,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i] ?? 120;
      });
      y -= rowHeight;

      // New page if out of space
      if (y < 60 && rowIdx < payload.tableData.length - 1) {
        const newPage = pdfDoc.addPage();
        y = height - 60;
        page.drawText("(continued...)", { x: marginX, y, size: 9, font });
      }
    });

    // ---------- SAVE ----------
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();

    toast.success("✅ PDF berhasil dibuat dengan format rapi!");
  };


  const handleExportToPDF_ORI2 = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (
  text: string,
  x: number,
  y: number,
  size: number = 10,
  boldFont: boolean = false,
  color = rgb(0, 0, 0)
) => {
  page.drawText(String(text || ""), {
    x,
    y,
    size,
    font: boldFont ? bold : font,
    color,
  });
};


const drawRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: any,
  stroke: boolean = true
) => {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: fillColor,
    borderColor: rgb(0, 0, 0),
    borderWidth: stroke ? 0.5 : 0,
  });
};


    let y = height - 60;
    const margin = 40;

    // HEADER: Aggregated Information
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Aggregated Information", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 35;

    // Preparer + Payment Thru
    drawText("Preparer", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(user?.name || "—", margin + 85, y);
    y -= 20;

    drawText("Payment Thru", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(paymentThru.join(" / ") || "-", margin + 85, y);
    y -= 30;

    // Distribution Table
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Distribution", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    const sizes = ["S", "M", "L", "XL", "2XL"];
    const sizeValues = sizes.map((s) => sizeSummary[s] || 0);
    const colW = 60;

    // Header row
    sizes.forEach((s, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(0.9, 0.9, 0.9));
      drawText(s, margin + i * colW + 22, y - 13, 10, true);
    });
    y -= 18;

    // Value row
    sizeValues.forEach((v, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(1, 1, 1));
      drawText(v, margin + i * colW + 25, y - 13);
    });
    y -= 30;

    // Price Calculation Section
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Price Calculation", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    const labels = ["QTY(Pieces)", "(USD/PC)", "Amount(USD)", "Shipping(USD)", "Total(USD)", "Price(USD)"];
    const values = [
      qty,
      `$${unitPrice.toFixed(2)}`,
      `$${(qty * unitPrice).toFixed(2)}`,
      `$${shipping.toFixed(2)}`,
      `$${(qty * unitPrice + shipping).toFixed(2)}`,
      `$${pricePerUnit}`,
    ];

    // Header
    labels.forEach((t, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(0.9, 0.9, 0.9));
      drawText(t, margin + i * 90 + 5, y - 13, 9, true);
    });
    y -= 18;

    // Values
    values.forEach((v, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(1, 1, 1));
      drawText(v, margin + i * 90 + 5, y - 13, 9);
    });
    y -= 30;

    // POLICY SECTION
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Uniform Policy Acknowledgment Worksheet", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 35;

    drawText("Agreement Statement", margin, y, 10, true);
    y -= 15;
    drawText("By signing this worksheet, you agree to the following terms:", margin, y);
    y -= 20;

    drawText(
      "You acknowledge receipt of the uniform and agree to the stated price of:",
      margin,
      y
    );
    y -= 15;

    // Price box
    drawRect(margin + 300, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(`$ ${pricePerUnit}`, margin + 310, y);
    drawText(", which is non-refundable.", margin + 400, y);
    y -= 20;

    drawText("and payable by making payment to", margin, y);
    drawText(user?.name || "-", margin + 200, y);
    y -= 15;
    drawText(`thru ${paymentThru.join(" / ") || "-"}`, margin + 50, y);
    y -= 20;

    drawText("You understand and accept the Policy as described in Policy Document:", margin, y);
    y -= 15;

    // Policy code + name
    drawRect(margin, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(policyCode || "-", margin + 5, y);
    drawRect(margin + 85, y - 3, 250, 15, rgb(1, 1, 1));
    drawText(policyName || "-", margin + 90, y);
    y -= 25;

    drawText(
      "You agree to comply with the policy’s requirements at all times while serving.",
      margin,
      y
    );
    y -= 20;
    drawText(
      "Any noncompliance will be handled according to the disciplinary rules written in the referenced policy.All information provided in all reference scope of the document is true and accurate to the best of your knowledge",
      margin,
      y
    );

    // Save
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();

    toast.success("✅ PDF exported with formatted layout!");
  };

  const handleExportToPDF_ORI3 = async () => {
    if (!data || data.length === 0) {
      toast.error("⚠️ Tidak ada data tabel untuk diexport.");
      return;
    }

    const headers = data[0];
    const tableRows = data.slice(1).map((row, rowIdx) => {
      const rowObj: Record<string, string> = {};
      row.forEach((cell, cellIdx) => {
        const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
        rowObj[mappedField] = cell;
      });
      if (!Object.values(headerMapping).includes("size")) {
        rowObj["size"] = assignedSizes[rowIdx] || "";
      }
      return rowObj;
    });

    const payload = {
      preparer: user?.name || "Unknown Preparer",
      payableTo: user?.name || "Unknown Payee",
      productInfo: { productCode, productName, departmentName, projectName, systemDate },
      paymentInfo: { paymentThru, methods },
      priceCalculation: { qty, unitPrice, shipping, pricePerUnit },
      policyAcknowledgment: {
        policyCode,
        policyName,
        policyPrice: pricePerUnit,
        isPolicyAgreed,
        systemDate,
      },
      sizeSummary,
      tableData: tableRows,
    };

    // 🧾 Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (text: string, x: number, y: number, size = 10, isBold = false, color = rgb(0, 0, 0)) => {
      page.drawText(String(text || ""), { x, y, size, font: isBold ? bold : font, color });
    };

    const drawRect = (x: number, y: number, w: number, h: number, fillColor: any, stroke = true) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: fillColor,
        borderColor: rgb(0, 0, 0),
        borderWidth: stroke ? 0.5 : 0,
      });
    };

    let y = height - 60;
    const margin = 40;

    // SECTION 1: Aggregated Information
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Aggregated Information", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 35;

    drawText("Preparer", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(payload.preparer, margin + 85, y);
    y -= 20;

    drawText("Payment Thru", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(paymentThru.join(" / ") || "-", margin + 85, y);
    y -= 30;

    // SECTION 2: Distribution
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Distribution", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    const sizes = ["S", "M", "L", "XL", "2XL", "TOTAL"];
    const sizeValues = sizes.map((s) => sizeSummary[s] || 0);
    const colW = 60;

    sizes.forEach((s, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(0.9, 0.9, 0.9));
      drawText(s, margin + i * colW + 22, y - 13, 10, true);
    });
    y -= 18;
    sizeValues.forEach((v, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(1, 1, 1));
      drawText(v, margin + i * colW + 25, y - 13);
    });
    y -= 30;

    // SECTION 3: Price Calculation
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Price Calculation", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    const labels = ["QTY(Pieces)", "(USD/PC)", "Amount(USD)", "Shipping(USD)", "Total(USD)", "Price(USD)"];
    const values = [
      qty,
      `$${unitPrice.toFixed(2)}`,
      `$${(qty * unitPrice).toFixed(2)}`,
      `$${shipping.toFixed(2)}`,
      `$${(qty * unitPrice + shipping).toFixed(2)}`,
      `$${pricePerUnit}`,
    ];

    labels.forEach((t, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(0.9, 0.9, 0.9));
      drawText(t, margin + i * 90 + 5, y - 13, 9, true);
    });
    y -= 18;
    values.forEach((v, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(1, 1, 1));
      drawText(v, margin + i * 90 + 5, y - 13, 9);
    });
    y -= 35;

    // SECTION 4: Uniform Policy Acknowledgment Worksheet
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Uniform Policy Acknowledgment Worksheet", margin + 5, y - 13, 11, true, rgb(1, 1, 1));

    y -= 40;
    drawText("Agreement Statement", margin, y, 10.5, true);
    y -= 18;

    drawText(
      "By signing this worksheet, you agree to the following terms:",
      margin,
      y
    );
    y -= 20;

    drawText(
      "You acknowledge receipt of the uniform and agree to the stated price of:",
      margin,
      y
    );
    y -= 15;

    drawText(", which is non-refundable.", margin, y);
    drawRect(margin + 120, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(`$ ${pricePerUnit}`, margin + 130, y, 10, true);
    y -= 25;

    drawText("and payable by making payment to:", margin, y);
    drawText(payload.payableTo, margin + 160, y, 10, true);
    y -= 15;

    drawText("thru:", margin, y);
    drawText(paymentThru.join(" / ") || "-", margin + 60, y, 10, true);
    y -= 25;

    drawText(
      "You understand and accept the Policy as described in Policy Document:",
      margin,
      y
    );
    y -= 18;

    drawRect(margin, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(payload.policyAcknowledgment.policyCode, margin + 5, y, 10, true);
    drawRect(margin + 85, y - 3, 250, 15, rgb(1, 1, 1));
    drawText(payload.policyAcknowledgment.policyName, margin + 90, y, 10);
    y -= 28;

    drawText(
      "You agree to comply with the policy’s requirements at all times while serving.",
      margin,
      y
    );

      y -= 20;
      drawText(
        "Any noncompliance will be handled according to the disciplinary rules written in the referenced policy.All information provided in all reference scope of the document is true and accurate to the best of your knowledge",
        margin,
        y
      );
    // FOOTER
    const footerText = `Generated on ${new Date().toLocaleDateString()} by ${payload.preparer}`;
    page.drawText(footerText, {
      x: width - margin - 200,
      y: 30,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // SAVE FILE
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();

    toast.success("✅ PDF exported successfully!");
  };

  const handleExportToPDF_OK = async () => {

  // ✅ Cek checkbox Policy Agreement
  if (!isPolicyAgreed) {
    toast.error("⚠️ You must agree to the Policy before exporting to PDF!");
    return;
  }

    if (!data || data.length === 0) {
      toast.error("⚠️ No table data available to export.");
      return;
    }

    // Ambil data tabel
    const headers = data[0];
    const tableRows = data.slice(1).map((row, rowIdx) => {
      const rowObj: Record<string, string> = {};
      row.forEach((cell, cellIdx) => {
        const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
        rowObj[mappedField] = cell;
      });
      if (!Object.values(headerMapping).includes("size")) {
        rowObj["size"] = assignedSizes[rowIdx] || "";
      }
      return rowObj;
    });

    // Kumpulkan semua data form
    const payload = {
      preparer: user?.name || "Unknown Preparer",
      payableTo: user?.name || "Unknown Payee",
      productInfo: { productCode, productName, departmentName, projectName, systemDate },
      paymentInfo: { paymentThru, methods },
      priceCalculation: { qty, unitPrice, shipping, pricePerUnit },
      policyAcknowledgment: {
        policyCode,
        policyName,
        policyPrice: pricePerUnit,
        isPolicyAgreed,
        systemDate,
      },
      sizeSummary,
      tableData: tableRows,
    };

    // 🧾 Buat PDF baru
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (text: string, x: number, y: number, size = 10, boldFont = false, color = rgb(0, 0, 0)) => {
      page.drawText(String(text || ""), { x, y, size, font: boldFont ? bold : font, color });
    };

    const drawRect = (x: number, y: number, w: number, h: number, fillColor: any, stroke = true) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: fillColor,
        borderColor: rgb(0, 0, 0),
        borderWidth: stroke ? 0.5 : 0,
      });
    };

    // Helper buat text wrapping panjang
    const wrapText = (text: string, maxWidth: number, fontSize = 10) => {
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];
      for (const word of words) {
        const testLine = line + word + " ";
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth) {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
      return lines;
    };

    let y = height - 60;
    const margin = 40;

    // ---------- SECTION 1: Aggregated Information ----------
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Aggregated Information", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 35;

    drawText("Preparer", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(payload.preparer, margin + 85, y);
    y -= 20;

    drawText("Payment Thru", margin, y);
    drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
    drawText(paymentThru.join(" / ") || "-", margin + 85, y);
    y -= 30;

    // ---------- SECTION 2: Distribution ----------
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Distribution", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    // Hitung total otomatis
    const sizes = ["S", "M", "L", "XL", "2XL"];
    const totalSize = sizes.reduce((sum, s) => sum + (sizeSummary[s] || 0), 0);
    const allSizes = [...sizes, "TOTAL"];
    const sizeValues = [...sizes.map((s) => sizeSummary[s] || 0), totalSize];
    const colW = 60;

    // Header
    allSizes.forEach((s, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(0.9, 0.9, 0.9));
      drawText(s, margin + i * colW + 22, y - 13, 10, true);
    });
    y -= 18;

    // Values
    sizeValues.forEach((v, i) => {
      drawRect(margin + i * colW, y - 18, colW, 18, rgb(1, 1, 1));
      drawText(v, margin + i * colW + 25, y - 13);
    });
    y -= 30;

    // ---------- SECTION 3: Price Calculation ----------
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Price Calculation", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 25;

    const labels = ["QTY(Pieces)", "(USD/PC)", "Amount(USD)", "Shipping(USD)", "Total(USD)", "Price(USD)"];
    const values = [
      qty,
      `$${unitPrice.toFixed(2)}`,
      `$${(qty * unitPrice).toFixed(2)}`,
      `$${shipping.toFixed(2)}`,
      `$${(qty * unitPrice + shipping).toFixed(2)}`,
      `$${pricePerUnit}`,
    ];

    labels.forEach((t, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(0.9, 0.9, 0.9));
      drawText(t, margin + i * 90 + 5, y - 13, 9, true);
    });
    y -= 18;

    values.forEach((v, i) => {
      drawRect(margin + i * 90, y - 18, 90, 18, rgb(1, 1, 1));
      drawText(v, margin + i * 90 + 5, y - 13, 9);
    });
    y -= 35;

    // ---------- SECTION 4: Uniform Policy Acknowledgment Worksheet ----------
    drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
    drawText("Uniform Policy Acknowledgment Worksheet", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
    y -= 40;

    drawText("Agreement Statement", margin, y, 10.5, true);
    y -= 18;

    drawText("By signing this worksheet, you agree to the following terms:", margin, y);
    y -= 20;

    drawText("You acknowledge receipt of the uniform and agree to the stated price of:", margin, y);
    y -= 15;

    drawRect(margin + 300, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(`$ ${pricePerUnit}`, margin + 310, y);
    drawText(", which is non-refundable.", margin + 400, y);
    y -= 20;

    drawText("and payable by making payment to:", margin, y);
    drawText(payload.payableTo, margin + 180, y, 10, true);
    y -= 15;

    drawText(`thru: ${paymentThru.join(" / ") || "-"}`, margin, y);
    y -= 25;

    drawText("You understand and accept the Policy as described in Policy Document:", margin, y);
    y -= 18;

    drawRect(margin, y - 3, 80, 15, rgb(1, 1, 1));
    drawText(payload.policyAcknowledgment.policyCode, margin + 5, y);
    drawRect(margin + 85, y - 3, 250, 15, rgb(1, 1, 1));
    drawText(payload.policyAcknowledgment.policyName, margin + 90, y);
    y -= 25;

    drawText("You agree to comply with the policy’s requirements at all times while serving.", margin, y);
    y -= 18;

    // 🔹 Long wrapped paragraph
    const longText =
      "Any noncompliance will be handled according to the disciplinary rules written in the referenced policy. All information provided in all reference scope of the document is true and accurate to the best of your knowledge.";
    const wrappedLines = wrapText(longText, width - margin * 2);
    wrappedLines.forEach((line) => {
      drawText(line, margin, y);
      y -= 14;
    });

    // ---------- FOOTER ----------
    const footerText = `Generated on ${new Date().toLocaleDateString()} by ${payload.preparer}`;
    drawText(footerText, width - margin - 200, 30, 8);

    // ---------- SAVE ----------
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();

    toast.success("✅ PDF exported successfully!");
  };


const handleExportToPDF_OK2 = async () => {
  // ✅ Checkbox validation
  if (!isPolicyAgreed) {
    toast.error("⚠️ You must agree to the Policy before exporting to PDF!");
    return;
  }

  // ✅ Validate data
  if (!data || data.length === 0) {
    toast.error("⚠️ No table data available to export.");
    return;
  }

  // 🧩 Prepare table data
  const headers = data[0];
  const tableRows = data.slice(1).map((row, rowIdx) => {
    const rowObj: Record<string, string> = {};
    row.forEach((cell, cellIdx) => {
      const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
      rowObj[mappedField] = cell;
    });
    if (!Object.values(headerMapping).includes("size")) {
      rowObj["size"] = assignedSizes[rowIdx] || "";
    }
    return rowObj;
  });

  // 🧾 Gather all data
  const payload = {
    preparer: user?.name || "Unknown Preparer",
    payableTo: user?.name || "Unknown Payee",
    productInfo: { productCode, productName, departmentName, projectName, systemDate },
    paymentInfo: { paymentThru, methods },
    priceCalculation: { qty, unitPrice, shipping, pricePerUnit },
    policyAcknowledgment: {
      policyCode,
      policyName,
      policyPrice: pricePerUnit,
      isPolicyAgreed,
      systemDate,
    },
    sizeSummary,
    tableData: tableRows,
  };

  // 🧾 Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 🖋 Helper: draw text (accept string or number)
  const drawText = (
    text: string | number,
    x: number,
    y: number,
    size: number = 10,
    boldFont: boolean = false,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(String(text ?? ""), {
      x,
      y,
      size,
      font: boldFont ? bold : font,
      color,
    });
  };

  // 🟦 Helper: draw rectangle
  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: any,
    stroke: boolean = true
  ) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: fillColor,
      borderColor: rgb(0, 0, 0),
      borderWidth: stroke ? 0.5 : 0,
    });
  };

  // 🧩 Helper: wrap long text
  const wrapText = (text: string, maxWidth: number, fontSize = 10) => {
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const testLine = line + word + " ";
      const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (lineWidth > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  // Layout setup
  let y = height - 60;
  const margin = 40;

  // ---------- SECTION 1: Aggregated Information ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Aggregated Information", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 35;

  drawText("Preparer", margin, y);
  drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
  drawText(payload.preparer, margin + 85, y);
  y -= 20;

  drawText("Payment Thru", margin, y);
  drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
  drawText(paymentThru.join(" / ") || "-", margin + 85, y);
  y -= 30;

  // ---------- SECTION 2: Distribution ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Distribution", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 25;

  const sizes = ["S", "M", "L", "XL", "2XL"];
  const totalSize = sizes.reduce((sum, s) => sum + (sizeSummary[s] || 0), 0);
  const allSizes = [...sizes, "TOTAL"];
  const sizeValues = [...sizes.map((s) => sizeSummary[s] || 0), totalSize];
  const colW = 60;

  // Header
  allSizes.forEach((s, i) => {
    drawRect(margin + i * colW, y - 18, colW, 18, rgb(0.9, 0.9, 0.9));
    drawText(s, margin + i * colW + 22, y - 13, 10, true);
  });
  y -= 18;

  // Values
  sizeValues.forEach((v: number, i: number) => {
    drawRect(margin + i * colW, y - 18, colW, 18, rgb(1, 1, 1));
    drawText(String(v), margin + i * colW + 25, y - 13);
  });
  y -= 30;

  // ---------- SECTION 3: Price Calculation ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Price Calculation", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 25;

  const labels = ["QTY(Pieces)", "(USD/PC)", "Amount(USD)", "Shipping(USD)", "Total(USD)", "Price(USD)"];
  const values = [
    qty,
    `$${unitPrice.toFixed(2)}`,
    `$${(qty * unitPrice).toFixed(2)}`,
    `$${shipping.toFixed(2)}`,
    `$${(qty * unitPrice + shipping).toFixed(2)}`,
    `$${pricePerUnit}`,
  ];

  labels.forEach((t, i) => {
    drawRect(margin + i * 90, y - 18, 90, 18, rgb(0.9, 0.9, 0.9));
    drawText(t, margin + i * 90 + 5, y - 13, 9, true);
  });
  y -= 18;

  values.forEach((v: string | number, i: number) => {
    drawRect(margin + i * 90, y - 18, 90, 18, rgb(1, 1, 1));
    drawText(String(v), margin + i * 90 + 5, y - 13, 9);
  });
  y -= 35;

  // ---------- SECTION 4: Uniform Policy Acknowledgment Worksheet ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Uniform Policy Acknowledgment Worksheet", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 40;

  drawText("Agreement Statement", margin, y, 10.5, true);
  y -= 18;

  drawText("By signing this worksheet, you agree to the following terms:", margin, y);
  y -= 20;

  drawText("You acknowledge receipt of the uniform and agree to the stated price of:", margin, y);
  y -= 15;

  drawRect(margin + 300, y - 3, 80, 15, rgb(1, 1, 1));
  drawText(`$ ${pricePerUnit}`, margin + 310, y);
  drawText(", which is non-refundable.", margin + 400, y);
  y -= 20;

  drawText("and payable by making payment to:", margin, y);
  drawText(payload.payableTo, margin + 180, y, 10, true);
  y -= 15;

  drawText(`thru: ${paymentThru.join(" / ") || "-"}`, margin, y);
  y -= 25;

  drawText("You understand and accept the Policy as described in Policy Document:", margin, y);
  y -= 18;

  drawRect(margin, y - 3, 80, 15, rgb(1, 1, 1));
  drawText(payload.policyAcknowledgment.policyCode, margin + 5, y);
  drawRect(margin + 85, y - 3, 250, 15, rgb(1, 1, 1));
  drawText(payload.policyAcknowledgment.policyName, margin + 90, y);
  y -= 25;

  drawText("You agree to comply with the policy’s requirements at all times while serving.", margin, y);
  y -= 18;

  const longText =
    "Any noncompliance will be handled according to the disciplinary rules written in the referenced policy. All information provided in all reference scope of the document is true and accurate to the best of your knowledge.";
  const wrappedLines = wrapText(longText, width - margin * 2);
  wrappedLines.forEach((line: string) => {
    drawText(line, margin, y);
    y -= 14;
  });

  // ---------- FOOTER ----------
  const footerText = `Generated on ${new Date().toLocaleDateString()} by ${payload.preparer}`;
  drawText(footerText, width - margin - 200, 30, 8);

  // ---------- SAVE ----------
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();

  toast.success("✅ PDF exported successfully!");
};


const handleExportToPDF = async () => {
  // ✅ Checkbox validation
  if (!isPolicyAgreed) {
    toast.error("⚠️ You must agree to the Policy before exporting to PDF!");
    return;
  }

  // ✅ Validate data
  if (!data || data.length === 0) {
    toast.error("⚠️ No table data available to export.");
    return;
  }

  // 🧩 Prepare table data
  const headers = data[0];
  const tableRows = data.slice(1).map((row, rowIdx) => {
    const rowObj: Record<string, string> = {};
    row.forEach((cell, cellIdx) => {
      const mappedField = headerMapping[cellIdx] || headers[cellIdx] || `col_${cellIdx + 1}`;
      rowObj[mappedField] = String(cell);
    });
    if (!Object.values(headerMapping).includes("size")) {
      rowObj["size"] = assignedSizes[rowIdx] || "";
    }
    return rowObj;
  });

  // 🧾 Gather all data
  const payload = {
    preparer: user?.name || "Unknown Preparer",
    payableTo: user?.name || "Unknown Payee",
    productInfo: { productCode, productName, departmentName, projectName, systemDate },
    paymentInfo: { paymentThru, methods },
    priceCalculation: { qty, unitPrice, shipping, pricePerUnit },
    policyAcknowledgment: {
      policyCode,
      policyName,
      policyPrice: pricePerUnit,
      isPolicyAgreed,
      systemDate,
    },
    sizeSummary,
    tableData: tableRows,
  };

  // 🧾 Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 🖋 Helper: draw text (accept string or number)
  const drawText = (
    text: string | number,
    x: number,
    y: number,
    size: number = 10,
    boldFont: boolean = false,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(String(text ?? ""), {
      x,
      y,
      size,
      font: boldFont ? bold : font,
      color,
    });
  };

  // 🟦 Helper: draw rectangle
  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: any,
    stroke: boolean = true
  ) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: fillColor,
      borderColor: rgb(0, 0, 0),
      borderWidth: stroke ? 0.5 : 0,
    });
  };

  // 🧩 Helper: wrap long text
  const wrapText = (text: string, maxWidth: number, fontSize = 10) => {
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const testLine = line + word + " ";
      const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (lineWidth > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  // Layout setup
  let y = height - 60;
  const margin = 40;

  // ---------- SECTION 1: Aggregated Information ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Aggregated Information", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 35;

  drawText("Preparer", margin, y);
  drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
  drawText(payload.preparer, margin + 85, y);
  y -= 20;

  drawText("Payment Thru", margin, y);
  drawRect(margin + 80, y - 3, 180, 15, rgb(1, 1, 1), false);
  drawText(paymentThru.join(" / ") || "-", margin + 85, y);
  y -= 30;

  // ---------- SECTION 2: Distribution ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Distribution", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 25;

  const sizes = ["S", "M", "L", "XL", "2XL"];
  const totalSize = sizes.reduce((sum, s) => sum + (sizeSummary[s] || 0), 0);
  const allSizes = [...sizes, "TOTAL"];
  const sizeValues = [...sizes.map((s) => sizeSummary[s] || 0), totalSize];
  const colW = 60;

  // Header
  allSizes.forEach((s, i) => {
    drawRect(margin + i * colW, y - 18, colW, 18, rgb(0.9, 0.9, 0.9));
    drawText(s, margin + i * colW + 22, y - 13, 10, true);
  });
  y -= 18;

  // Values
  sizeValues.forEach((v, i) => {
    drawRect(margin + i * colW, y - 18, colW, 18, rgb(1, 1, 1));
    drawText(String(v), margin + i * colW + 25, y - 13);
  });
  y -= 30;

  // ---------- SECTION 3: Price Calculation ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Price Calculation", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 25;

  const labels = ["QTY(Pieces)", "(USD/PC)", "Amount(USD)", "Shipping(USD)", "Total(USD)", "Price(USD)"];
  const values = [
    qty,
    `$${unitPrice.toFixed(2)}`,
    `$${(qty * unitPrice).toFixed(2)}`,
    `$${shipping.toFixed(2)}`,
    `$${(qty * unitPrice + shipping).toFixed(2)}`,
    `$${pricePerUnit}`,
  ];

  labels.forEach((t, i) => {
    drawRect(margin + i * 90, y - 18, 90, 18, rgb(0.9, 0.9, 0.9));
    drawText(t, margin + i * 90 + 5, y - 13, 9, true);
  });
  y -= 18;

  values.forEach((v, i) => {
    drawRect(margin + i * 90, y - 18, 90, 18, rgb(1, 1, 1));
    drawText(String(v), margin + i * 90 + 5, y - 13, 9);
  });
  y -= 40;

  // ---------- SECTION 4: Uniform Policy Acknowledgment Worksheet ----------
  drawRect(margin, y - 18, width - margin * 2, 18, rgb(0, 0, 0));
  drawText("Uniform Policy Acknowledgment Worksheet", margin + 5, y - 13, 11, true, rgb(1, 1, 1));
  y -= 45; // turun lebih jauh biar “Agreement Statement” rapi

  drawText("Agreement Statement", margin, y, 10.5, true);
  y -= 22;

  drawText("By signing this worksheet, you agree to the following terms:", margin, y);
  y -= 20;

  drawText("You acknowledge receipt of the uniform and agree to the stated price of:", margin, y);
  y -= 15;

  drawRect(margin + 300, y - 3, 80, 15, rgb(1, 1, 1));
  drawText(`$ ${pricePerUnit}`, margin + 310, y);
  drawText(", which is non-refundable.", margin + 400, y);
  y -= 20;

  drawText("and payable by making payment to:", margin, y);
  drawText(payload.payableTo, margin + 180, y, 10, true);
  y -= 15;

  drawText(`thru: ${paymentThru.join(" / ") || "-"}`, margin, y);
  y -= 25;

  drawText("You understand and accept the Policy as described in Policy Document:", margin, y);
  y -= 18;

  drawRect(margin, y - 3, 80, 15, rgb(1, 1, 1));
  drawText(payload.policyAcknowledgment.policyCode, margin + 5, y);
  drawRect(margin + 85, y - 3, 250, 15, rgb(1, 1, 1));
  drawText(payload.policyAcknowledgment.policyName, margin + 90, y);
  y -= 25;

  drawText("You agree to comply with the policy’s requirements at all times while serving.", margin, y);
  y -= 18;

  const longText =
    "Any noncompliance will be handled according to the disciplinary rules written in the referenced policy. All information provided in all reference scope of the document is true and accurate to the best of your knowledge.";
  const wrappedLines = wrapText(longText, width - margin * 2);
  wrappedLines.forEach((line) => {
    drawText(line, margin, y);
    y -= 14;
  });

  // ---------- FOOTER ----------
  const footerText = `Generated on ${new Date().toLocaleDateString()} by ${payload.preparer}`;
  drawText(footerText, width - margin - 200, 30, 8);

  // ---------- SAVE ----------
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Uniform-Form-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();

  toast.success("✅ PDF exported successfully!");
};


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


    // 🟢 Tambah baris baru ke tabel
  const handleAddRow = () => {
    if (!data || data.length === 0) return;

    const colCount = data[0].length;
    const emptyRow = Array(colCount).fill('');
    setData((prev) => (prev ? [...prev, emptyRow] : [data[0], emptyRow]));
  };



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

          <div className="flex justify-end mb-3">
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ➕ Add New Row
            </button>
          </div>


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
              className={`border px-3 py-2 ${
                isError
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <input
                type="text"
                value={cell}
                onChange={(e) => {
                  const val = e.target.value;
                  setData((prev) => {
                    if (!prev) return prev;
                    const updated = [...prev];
                    updated[globalRowIdx + 1][cellIdx] = val; // +1 karena header
                    return updated;
                  });
                }}
                className="w-full px-2 py-1 rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </td>
          );

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

            {/* KANAN: Tombol-tombol aksi */}
            <div className="col-span-12 md:col-span-2 flex flex-col space-y-2">


              {/* <button
              onClick={handleSaveToConsole}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Save
              </button> */}

              <button
                onClick={handleExportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Export to PDF
              </button>

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
