// pages/api/upload.ts
import { IncomingForm, Files, File } from 'formidable'
import fs from 'fs'
import * as XLSX from 'xlsx'
import withAuthAPI from '@/lib/withAuthAPI'
import type { NextApiRequest, NextApiResponse } from 'next'

// ⛔ Harus disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
}

// ✅ Tipe request yang sudah disisipkan user oleh withAuthAPI
interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string
    email?: string
    role?: string
    [key: string]: unknown
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const form = new IncomingForm({
    uploadDir: '/tmp', // ✅ direktori sementara di Vercel/Linux
    keepExtensions: true,
  })

  form.parse(req, async (err, fields, files: Files) => {
    if (err) {
      return res.status(500).json({ message: 'Upload error', error: err })
    }

    try {
      const fileField = files.file
      if (!fileField) return res.status(400).json({ message: 'No file uploaded' })

      // ✅ Tangani single/multiple file upload
      const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField
      const filePath = (uploadedFile as File).filepath

      // ✅ Baca isi Excel
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // 🔥 Hapus file setelah dibaca
      fs.unlinkSync(filePath)

      // ✅ Dapatkan info user dari middleware auth
      const user = req.user
      console.log('✅ Upload by UID:', user?.uid)

      res.status(200).json({ data })
    } catch (error) {
      const err = error as Error
      res.status(500).json({ message: 'Failed to process file', error: err.message })
    }
  })
}

// ⛳️ Bungkus handler dengan autentikasi middleware
export default withAuthAPI(handler)
