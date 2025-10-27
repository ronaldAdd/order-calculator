// utils/validateMappedDebtor.ts

export function validateMappedDebtor(
  mappedObj: Record<string, any>,
  mappingFields: { value: string; type?: string }[]
): Record<string, string> {
  const errors: Record<string, string> = {}

  mappingFields.forEach(({ value, type }) => {
    const val = mappedObj[value]
    if (val == null || val === '') return // boleh kosong

    switch (type?.toUpperCase()) {
      case 'DECIMAL':
        if (isNaN(Number(val))) {
          errors[value] = 'Harus berupa angka'
        }
        break

      case 'INTEGER':
        if (!/^-?\d+$/.test(val)) {
          errors[value] = 'Harus berupa bilangan bulat'
        }
        break

      case 'DATEONLY':
      case 'DATE':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          errors[value] = 'Format harus YYYY-MM-DD'
        }
        break

      case 'JSON':
        try {
          if (typeof val === 'string') {
            if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
              JSON.parse(val)
            } else if (value === 'mobilePhones') {
              // handle manual string jadi array
              const list = val.split(',').map(v => v.trim())
              if (!Array.isArray(list) || list.some(v => v === '')) {
                throw new Error()
              }
            } else {
              throw new Error()
            }
          } else if (!Array.isArray(val) && typeof val !== 'object') {
            throw new Error()
          }
        } catch {
          errors[value] = 'Format JSON tidak valid'
        }
        break

      default:
        break
    }
  })

  return errors
}
