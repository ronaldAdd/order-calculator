import { z } from 'zod'
import {
  religionOptions,
  maritalStatusOptions,
  sexOptions,
  statusOptions,
  forecastOptions,
  productNameOptions,
} from '@/constants/formOptions'

const phoneRegex = /^(?:\+62|62|08)[0-9]{8,13}$/

const numericField = (fieldName: string) =>
  z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    if (typeof val === 'string') return parseFloat(val.trim())
    return val
  }, z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a number`,
  }).min(0, `${fieldName} cannot be negative`))

const debtorSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'First name must only contain letters, spaces, or hyphens'),

  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'Last name must only contain letters, spaces, or hyphens'),

  nationalId: z
    .string({ required_error: 'National ID is required' })
    .length(16, 'National ID must be exactly 16 digits')
    .regex(/^[0-9]+$/, 'National ID must contain only numbers'),

  dob: z
    .string({ required_error: 'Date of birth is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((val) => {
      const date = new Date(val)
      const age = new Date().getFullYear() - date.getFullYear()
      return !isNaN(date.getTime()) && age >= 18
    }, 'Debtor must be at least 18 years old'),

  status: z
    .string({ required_error: 'Status is required' })
    .refine((val) => statusOptions.includes(val), {
      message: 'Invalid status',
    }),

  forecast: z
    .string({ required_error: 'Forecast is required' })
    .refine((val) => forecastOptions.includes(val), {
      message: 'Invalid forecast',
    }),

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
    .refine((val) => productNameOptions.map(p => p.value).includes(val), {
      message: 'Invalid product name',
    }),

  outstandingAmount: numericField('Outstanding amount'),
  principalAmount: numericField('Principal amount'),
  lastPaymentAmount: numericField('Last Payment Amount'),
  totalPaid: numericField('Total Paid Amount'),

  mobilePhones: z
    .array(z.string().regex(phoneRegex, 'Invalid phone number format'))
    .min(1, 'At least one mobile phone number is required')
    .refine((arr) => new Set(arr).size === arr.length, 'Duplicate phone numbers are not allowed'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Email must be a valid email address'),

  nextFollowUpDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const now = new Date()
      const selected = new Date(val)
      return selected > now
    }, 'Next follow-up date must be in the future'),

  assignedCollector: z.string({ required_error: 'Collector is required' }),

  homePhone: z.string().optional(),
  officePhone: z.string().optional(),
  address: z.string().optional(),
  jobTitle: z.string().optional(),
  employerName: z.string().optional(),
  officeAddress: z.string().optional(),
  loanId: z.string().optional(),
  lastPaymentDate: z.string().optional(),

  Relations: z
    .array(
      z.object({
        relationName: z.string().optional(),
        relationshipType: z.string().optional(),
        relationPhone: z.string().optional(),
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

export default debtorSchema
