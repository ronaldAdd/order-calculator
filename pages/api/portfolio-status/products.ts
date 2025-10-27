// pages/api/portfolio-status/products.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { productNameOptions } from '@/constants/formOptions'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Langsung kirim daftar produk dari constants
  res.status(200).json(productNameOptions)
}
