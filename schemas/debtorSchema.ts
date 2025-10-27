import { z } from 'zod'
import {
  religionOptions,
  maritalStatusOptions,
  sexOptions,
  statusOptions,
  forecastOptions,
  productNameOptions,
} from '@/constants/formOptions'

// Regex validasi nomor HP Indonesia
const phoneRegex = /^(?:\+62|62|08)[0-9]{8,13}$/

const parseCurrency = (value: unknown): number | undefined => {
  if (value == null) return undefined;

  if (typeof value === 'number') {
    return isNaN(value) ? undefined : value;
  }

  if (typeof value !== 'string') return undefined;

  const cleaned = value
    .replace(/[^\d.,-]/g, '')         // Hapus semua kecuali angka, titik, koma, minus
    .replace(/\.(?=\d{3})/g, '')      // Hapus titik pemisah ribuan (misal: 5.450.000 → 5450000)
    .replace(',', '.');              // Ganti koma (,) jadi titik desimal

  const result = parseFloat(cleaned);
  return isNaN(result) ? undefined : result;
};


// Helper untuk field angka (boleh kosong tapi jika diisi harus number >= 0)
const numericFieldOLD = (fieldName: string) =>
  z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    if (typeof val === 'string') return parseFloat(val.trim())
    return val
  }, z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a number`,
  }).min(0, `${fieldName} cannot be negative`))


const numericField = (fieldName: string) =>
  z.preprocess(parseCurrency, z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a number`,
  }).min(0, `${fieldName} cannot be negative`))

const numericFieldOptional = (fieldName: string) =>
  z.preprocess(parseCurrency, z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a number`,
  }).min(0, `${fieldName} cannot be negative`).optional())

// Schema utama
const debtorSchema = z
  .object({
    fullName: z
      .string({ required_error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters')
      .optional(),

    firstName: z
      .string({ required_error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters')
      .regex(/^[a-zA-Z\s-]+$/, 'First name must only contain letters, spaces, or hyphens'),

    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters')
      .regex(/^[a-zA-Z\s-]+$/, 'Last name must only contain letters, spaces, or hyphens')
      .optional(),


    dob: z.preprocess((val) => {
      if (typeof val !== 'string') return val

      const tryParse = (str: string): string | undefined => {
        const date = new Date(str)
        return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0]
      }

      const parsed = tryParse(val) || tryParse(val.replace(/\//g, '-'))
      return parsed ?? val
    }, z
      .string({ required_error: 'Date of birth is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
      .refine((val) => {
        const date = new Date(val)
        const age = new Date().getFullYear() - date.getFullYear()
        return !isNaN(date.getTime()) && age >= 18
      }, 'Debtor must be at least 18 years old')
    ),

    status: z
      .string({ required_error: 'Status is required' })
      .refine((val) => statusOptions.includes(val), {
        message: 'Invalid status',
      }).optional(),

    nextFollowUpDate: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;

      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return undefined;

      return parsed.toISOString().split('T')[0]; // YYYY-MM-DD
    }, z.string().optional()),


    forecast: z
      .string({ required_error: 'Forecast is required' })
      .refine((val) => forecastOptions.includes(val), {
        message: 'Invalid forecast',
      }).optional(),

    religion: z
      .string()
      .optional()
      .refine((val) => !val || religionOptions.includes(val), {
        message: 'Invalid religion',
      }),

    maritalStatus: z
      .string()
      .optional()
      .refine((val) => !val || maritalStatusOptions.includes(val), {
        message: 'Invalid marital status',
      }),

    sex: z
      .string()
      .optional()
      .refine((val) => !val || sexOptions.includes(val), {
        message: 'Invalid sex',
      }),

    productName: z
      .string({ required_error: 'Product name is required' })
      .refine((val) => productNameOptions.map((p) => p.value).includes(val), {
        message: 'Invalid product name',
      }),

    outstandingAmount: numericField('Outstanding amount'),
    principalAmount: numericField('Principal amount'),
    lastPaymentAmount: numericField('Last Payment Amount'),
    totalPaid: numericFieldOptional('Total Paid Amount'),
    rutinAmount: numericFieldOptional('Rutin Amount'),
    installment: numericFieldOptional('installment'),

    mobilePhones: z
      .array(z.string().regex(phoneRegex, 'Invalid phone number format'))
      .min(1, 'At least one mobile phone number is required')
      .refine((arr) => new Set(arr).size === arr.length, 'Duplicate phone numbers are not allowed'),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Email must be a valid email address').optional(),

    //assignedCollector: z.string({ required_error: 'Collector is required' }),
    assignedCollector: z.string().optional(),

    homePhone: z.string().optional(),
    officePhone: z.string().optional(),
    address: z.string().optional(),
    jobTitle: z.string().optional(),
    employerName: z.string().optional(),
    officeAddress: z.string().optional(),
    loanId: z.string().optional(),

    //tambahan baru
    chargeOff: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;

      let parsed = new Date(val);
      if (isNaN(parsed.getTime())) {
        parsed = new Date(val.replace(/\//g, '-'));
      }
      if (isNaN(parsed.getTime())) return undefined;

      // Ambil tanggal lokal, bukan UTC
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`; // format YYYY-MM-DD
    }, z.string().optional()),

    startDate: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;

      let parsed = new Date(val);
      if (isNaN(parsed.getTime())) {
        parsed = new Date(val.replace(/\//g, '-'));
      }
      if (isNaN(parsed.getTime())) return undefined;

      // Ambil tanggal lokal, bukan UTC
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`; // format YYYY-MM-DD
    }, z.string().optional()),


    schemeCd: z.string().optional(),
    tenor: z.string().optional(),
    homeAddress1: z.string().optional(),
    homeAddress2: z.string().optional(),
    homeAddress3: z.string().optional(),
    homeLocation: z.string().optional(),
    homeZip: z.string().optional(), 
    officeAddress1: z.string().optional(),
    officeAddress2: z.string().optional(),
    officeAddress3: z.string().optional(),
    officeLocation: z.string().optional(),
    officeZip: z.string().optional(),
    handle: z.string().optional(),
    statusAccount: z.string().optional(),



    lastPaymentDate: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;

      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return undefined;

      return parsed.toISOString().split('T')[0]; // format YYYY-MM-DD
    }, z.string().optional()),

    Relations: z
      .array(
        z.object({
          relationName: z.string().optional(),
          relationshipType: z.string().optional(),
          relationPhone: z.string().optional(),
          relationAddress: z.string().optional(),
        })
      )
      .optional(),

    BankAccounts: z
      .array(
        z.object({
          bankName: z.string().optional(),
          accountType: z.string().optional(),
          accountNumber: z.string().optional(),
          accountHolder: z.string().optional(),
        })
      )
      .optional(),
  })

  // Validasi custom jika status adalah "Promise to Pay"
  .superRefine((data, ctx) => {
    const { status, nextFollowUpDate } = data

    if (status === 'Promise to Pay') {
      if (!nextFollowUpDate) {
        ctx.addIssue({
          path: ['nextFollowUpDate'],
          code: z.ZodIssueCode.custom,
          message: 'Next follow-up date is required when status is Promise to Pay',
        })
      } else {
        const selected = new Date(nextFollowUpDate)
        const now = new Date()
        if (selected <= now) {
          ctx.addIssue({
            path: ['nextFollowUpDate'],
            code: z.ZodIssueCode.custom,
            message: 'Next follow-up date must be in the future',
          })
        }
      }
    }
  })

export default debtorSchema
