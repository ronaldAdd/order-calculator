import debtorSchema from '@/schemas/debtorSchema'

export function validateMappedDebtorZod(row: Record<string, any>) {
  
  const parsed = debtorSchema.safeParse(row)

  if (parsed.success) {
    return { success: true, data: parsed.data }
  }

  const fieldErrors: { [field: string]: string } = {}

  parsed.error.errors.forEach((err) => {
    const field = err.path.join('.')
    fieldErrors[field] = err.message
  })

  return { success: false, error: fieldErrors }
}
