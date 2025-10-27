import { StylesConfig } from 'react-select'
export type OptionType = {
  value: string
  label: string
}
const reactSelectStylesSingle: StylesConfig<OptionType, false> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--tw-bg)',
    borderColor: state.isFocused ? '#3b82f6' : 'var(--tw-border-color)',
    color: 'var(--tw-text-color)',
    boxShadow: 'none',
    minHeight: '2.25rem',
    fontSize: '0.875rem',
    borderRadius: '0.375rem',
    '&:hover': {
      borderColor: '#3b82f6',
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--tw-bg)',
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
      ? 'var(--tw-bg-hover)'
      : 'var(--tw-bg)',
    color: state.isSelected ? '#ffffff' : 'var(--tw-text-color)',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--tw-text-color)',
  }),
  input: (base) => ({
    ...base,
    color: 'var(--tw-text-color)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--tw-placeholder-color)',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'var(--tw-text-color)',
    '&:hover': {
      color: '#3b82f6',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--tw-text-color)',
    '&:hover': {
      color: '#ef4444',
    },
  }),
}

export default reactSelectStylesSingle
