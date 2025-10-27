'use client'

import { useState, useEffect } from 'react'
import { FaTrash } from 'react-icons/fa'
import ReactSelect from 'react-select'
import type { SingleValue } from 'react-select'

type UserOption = {
  id: string
  name?: string
  email?: string
}

type SelectOption = {
  value: string
  label: string
}

const tabs = [
  'Assigned Collector',
  'Product Info',
  'Personal Info',
  'Contact Info',
  'Employment Info',
  'Financial Profile',
  'Related Info',
  'Status & Forecast',
] as const

type Tab = typeof tabs[number]

type Relations = { relationName: string; relationshipType: string; relationPhone: string }
type BankAccounts = { bankName: string; accountType: string; accountNumber: string; accountHolder: string }

export type DebtorFormData = {
  firstName: string
  lastName: string
  sex: string
  dob: string
  nationalId: string
  religion: string
  maritalStatus: string
  email: string
  mobilePhones: string[]
  homePhone: string
  officePhone: string
  address: string
  jobTitle: string
  employerName: string
  officeAddress: string
  loanId: string
  productName: string
  outstandingAmount: number | ''
  principalAmount: number | ''
  lastPaymentAmount: number | ''
  lastPaymentDate: string
  totalPaid: number | ''
  status: string
  forecast: string
  nextFollowUpDate: string
  assignedCollector: string
  Relations: Relations[]
  BankAccounts: BankAccounts[]
  User?:UserOption,
}

type Props = {
  initialData?: Partial<DebtorFormData>
  onSubmit: (data: DebtorFormData) => Promise<void> | void
}

const cleanInitialData = (data: Partial<DebtorFormData>): Partial<DebtorFormData> => {
  const numericFields = ['outstandingAmount', 'principalAmount', 'lastPaymentAmount', 'totalPaid']
  return Object.fromEntries(
    Object.entries(data).map(([key, val]) => {
      if (val === null || val === undefined) {
        if (numericFields.includes(key)) return [key, '']
        if (key === 'mobilePhones') return [key, ['']]
        if (key === 'Relations') return [key, [{ relationName: '', relationshipType: '', relationPhone: '' }]]
        if (key === 'BankAccounts') return [key, [{ bankName: '', accountType: '', accountNumber: '', accountHolder: '' }]]
        return [key, '']
      }
      return [key, val]
    })
  ) as Partial<DebtorFormData>
}

const religionOptions = ['Islam', 'Christianity', 'Catholicism', 'Hinduism', 'Buddhism', 'Other']
const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed']
const sexOptions = ['Male', 'Female']
const statusOptions = ['New', 'Contacted', 'Promise to Pay', 'Paid', 'Inactive']
const forecastOptions = ['High', 'Medium', 'Low']
// const productNameOptions = ['Akulaku', 'Kredivo', 'BNI']

export default function DebtorForm({ initialData = {}, onSubmit }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0])
  const [isLoading, setIsLoading] = useState(false)

  const [collectorOptions, setCollectorOptions] = useState<SelectOption[]>([])
  const [isLoadingCollectors, setIsLoadingCollectors] = useState(false)
  const [collectorError, setCollectorError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nationalIdError, setNationalIdError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null); // Error message for DOB
  const [emailError, setEmailError] = useState<string | null>(null); // Error message for Email
  const [nextFollowUpDateError, setNextFollowUpDateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollectors() {
      setIsLoadingCollectors(true)
      setCollectorError(null)
      try {
        const res = await fetch('/api/users/lists')
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        const options = data.data.map((user: UserOption) => ({
          value: user.id,
          label: user.name || user.email || user.id,
        }))
        setCollectorOptions(options)
      } catch (error) {
        setCollectorError(error instanceof Error ? error.message : 'Failed to load collectors')
      } finally {
        setIsLoadingCollectors(false)
      }
    }
    fetchCollectors()
  }, [])


  const [form, setForm] = useState<DebtorFormData>({
    firstName: '',
    lastName: '',
    sex: '',
    dob: '',
    nationalId: '',
    religion: '',
    maritalStatus: '',
    email: '',
    mobilePhones: [''],
    homePhone: '',
    officePhone: '',
    address: '',
    jobTitle: '',
    employerName: '',
    officeAddress: '',
    loanId: '',
    productName: '',
    outstandingAmount: '',
    principalAmount: '',
    lastPaymentAmount: '',
    lastPaymentDate: '',
    totalPaid: '',
    status: 'New',
    forecast: 'Medium',
    nextFollowUpDate: '',
    assignedCollector: '',
    Relations: [{ relationName: '', relationshipType: '', relationPhone: '' }],
    BankAccounts: [{ bankName: '', accountType: '', accountNumber: '', accountHolder: '' }],
    ...cleanInitialData(initialData),
  })


  useEffect(() => {
    if (form.status === 'Promise to Pay') {
      // Jika status 'Promise to Pay' dan tanggal follow-up kosong atau di masa lalu
      if (!form.nextFollowUpDate || new Date(form.nextFollowUpDate) <= new Date()) {
        setNextFollowUpDateError('Next follow-up date must be in the future.');
      } else {
        setNextFollowUpDateError(null); // Clear error jika valid
      }
    } else {
      setNextFollowUpDateError(null); // Clear error jika status bukan 'Promise to Pay'
    }
  }, [form.status, form.nextFollowUpDate]); // Memantau perubahan status dan tanggal


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
                  console.log(value,'error tgl');

    if (name === 'status') {
      // Validasi jika status diubah menjadi 'Promise to Pay'
      if (value === 'Promise to Pay') {
        // Validasi tanggal follow-up harus ada dan lebih besar dari hari ini
        if (!form.nextFollowUpDate || new Date(form.nextFollowUpDate) <= new Date()) {          
          setNextFollowUpDateError('Next follow-up date must be in the future.');
        } else {
          setNextFollowUpDateError(null); // Clear error jika valid
        }
      } else {
        setNextFollowUpDateError(null); // Clear error jika status bukan 'Promise to Pay'
      }
    }

    // Perbarui nilai form sesuai dengan nama dan value
    setForm(prev => ({
      ...prev,
      [name]: ['outstandingAmount', 'principalAmount', 'lastPaymentAmount', 'totalPaid'].includes(name)
        ? (value === '' ? '' : Number(value))
        : value,
    }));
  };


  const updateMobilePhone = (idx: number, value: string) => {
    const phones = [...form.mobilePhones]
    const onlyNumbers = value.replace(/[^\d+]/g, '')

    // Rule 1: Validasi panjang nomor (9-13 digit)
    if (onlyNumbers.length > 14) {
      setPhoneError('Phone number must be between 9 to 13 digits.');
      return;
    }  
      
    if (phones.includes(onlyNumbers)) {
      setPhoneError('This phone number is already added.')
      return
    }

    setPhoneError(null) // Clear error when phone is valid
    phones[idx] = onlyNumbers
    setForm(prev => ({ ...prev, mobilePhones: phones }))
    
  };  


  const addMobilePhone = () => setForm(prev => ({ ...prev, mobilePhones: [...prev.mobilePhones, ''] }))
  const removeMobilePhone = (idx: number) =>
    setForm(prev => ({ ...prev, mobilePhones: prev.mobilePhones.filter((_, i) => i !== idx) }))

  const updateEmergencyContact = (idx: number, field: keyof Relations, value: string) => {
    const contacts = [...form.Relations]
    contacts[idx][field] = value
    setForm(prev => ({ ...prev, Relations: contacts }))
  }

  const addEmergencyContact = () =>
    setForm(prev => ({
      ...prev,
      Relations: [...prev.Relations, { relationName: '', relationshipType: '', relationPhone: '' }],
    }))

  const removeEmergencyContact = (idx: number) =>
    setForm(prev => ({
      ...prev,
      Relations: prev.Relations.filter((_, i) => i !== idx),
    }))

  const updateBankAccount = (idx: number, field: keyof BankAccounts, value: string) => {
    const banks = [...form.BankAccounts]
    banks[idx][field] = value
    setForm(prev => ({ ...prev, accounts: banks }))
  }

  const addBankAccount = () =>
    setForm(prev => ({
      ...prev,
      BankAccounts: [...prev.BankAccounts, { bankName: '', accountType: '', accountNumber: '', accountHolder: '' }],
    }))

  const removeBankAccount = (idx: number) =>
    setForm(prev => ({
      ...prev,
      BankAccounts: prev.BankAccounts.filter((_, i) => i !== idx),
    }))


  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validasi panjang National ID
    if (value.length > 16) {
      setNationalIdError("National ID must be exactly 16 digits.");
      setTimeout(() => {
        setNationalIdError(null);
      }, 2000);
      return;
    }

    // Validasi hanya angka
    const isNumber = /^\d+$/.test(value);
    if (!isNumber) {
      setNationalIdError("National ID must only contain digits.");
      setTimeout(() => {
        setNationalIdError(null);
      }, 2000);
      return;
    }

    setNationalIdError(null); // Clear error when input is valid

    // Update value if valid
    setForm(prev => ({
      ...prev,
      nationalId: value,
    }));
  };


  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const today = new Date();
    const birthDate = new Date(value);
    
    // Hitung umur
    const age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    
    // Jika bulan lahir lebih besar dari bulan saat ini, berarti belum ulang tahun tahun ini
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      console.log(age);
    }

    // Cek apakah umur sudah 18 tahun atau lebih
    if (age < 18) {
      setDobError("You must be at least 18 years old.");
      setTimeout(() => {
        setDobError(null);
      }, 2000);
      return;
    }

    // Clear error jika umur valid
    setDobError(null);

    // Update nilai form
    setForm(prev => ({
      ...prev,
      dob: value,
    }));
  };


  // Handle perubahan input untuk Email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Validasi format email dengan RegEx
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Cek apakah email valid
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError(null); // Clear error jika valid
    }

    // Update nilai email pada form
    setForm(prev => ({
      ...prev,
      email: value,
    }));
  };

  // Render Tabs (Desktop and Mobile)
  const renderTabs = () => (
    <>
      <nav className="hidden sm:flex flex-wrap border-b border-gray-300 dark:border-gray-700 mb-4" aria-label="Tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-center text-sm font-semibold
              ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="sm:hidden mb-4">
        <label htmlFor="tab-select" className="sr-only">Select tab</label>
        <select
          id="tab-select"
          value={activeTab}
          onChange={e => setActiveTab(e.target.value as Tab)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {tabs.map(tab => (
            <option key={tab} value={tab}>{tab}</option>
          ))}
        </select>
      </div>
    </>
  )

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded px-3 py-2"

  // Render form content per tab
  const renderTab = () => {
    switch (activeTab) {
      case 'Assigned Collector':
        return (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Assigned Collector
            </label>
            <ReactSelect
              options={collectorOptions}
              value={collectorOptions.find(option => option.value === form.assignedCollector) || null}
              onChange={(option: SingleValue<SelectOption>) => setForm(prev => ({ ...prev, assignedCollector: option?.value || '' }))}
              classNamePrefix="react-select"
              isClearable
              isLoading={isLoadingCollectors}
              placeholder={isLoadingCollectors ? 'Loading collectors...' : 'Select collector'}
              noOptionsMessage={() => collectorError ? `Error: ${collectorError}` : 'No collectors found'}
            />
          </div>
        )
      case 'Product Info':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Product Name" name="productName" value={String(form.productName)} onChange={handleChange} inputClass={inputClass} />
            <Input label="Loan ID / Account ID" name="loanId" value={form.loanId} onChange={handleChange} inputClass={inputClass} />
          </div>
        )
      case 'Personal Info':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} inputClass={inputClass} />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} inputClass={inputClass} />
            <Select label="Sex" name="sex" value={form.sex} onChange={handleChange} options={sexOptions} inputClass={inputClass} />
            {/* <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} inputClass={inputClass} /> */}
            <div>
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleDateOfBirthChange}
                inputClass={inputClass}
              />
              {dobError && <p className="text-red-600">{dobError}</p>}
            </div>

            <div>
              <div>
                <Input
                  label="National ID"
                  name="nationalId"
                  value={form.nationalId}
                  onChange={handleNationalIdChange}
                  inputClass={inputClass}
                />
                {nationalIdError && <p className="text-red-600 mt-1">{nationalIdError}</p>} {/* Menambahkan margin-top supaya lebih rapih */}
              </div>
            </div>

            <Select label="Religion" name="religion" value={form.religion} onChange={handleChange} options={religionOptions} inputClass={inputClass} />
            <Select label="Marital Status" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} options={maritalStatusOptions} inputClass={inputClass} />
            {nationalIdError && <p className="text-red-600">{nationalIdError}</p>}
          </div>
        )
      case 'Contact Info':
        return (
          <div className="space-y-4">
            <div>
              <div>
                <Input
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleEmailChange}
                  inputClass={inputClass}
                />
                {emailError && <p className="text-red-600">{emailError}</p>}                
              </div>
            </div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile Phones</label>
            {form.mobilePhones.map((phone, idx) => (
              <div key={idx} className="flex space-x-2 mb-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => {
                    const onlyNumbers = e.target.value.replace(/[^\d+]/g, '') // hapus semua karakter non-angka
                    updateMobilePhone(idx, onlyNumbers)
                  }}
                  className={`${inputClass} flex-grow`}
                  placeholder={`081234567890`}
                />
                {form.mobilePhones.length > 1 && (
                  <button type="button" onClick={() => removeMobilePhone(idx)} className="text-red-600 hover:text-red-800" aria-label={`Remove mobile phone #${idx + 1}`}>
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            {phoneError && <p className="text-red-600">{phoneError}</p>}
            <button type="button" onClick={addMobilePhone} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              + Add mobile phone
            </button>
            <Input label="Home Phone" name="homePhone" value={form.homePhone} onChange={handleChange} inputClass={inputClass} />
            <Input label="Office Phone" name="officePhone" value={form.officePhone} onChange={handleChange} inputClass={inputClass} />
            <Textarea label="Address" name="address" value={form.address} onChange={handleChange} inputClass={inputClass} />
          </div>
        )
      case 'Employment Info':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Job Title" name="jobTitle" value={form.jobTitle} onChange={handleChange} inputClass={inputClass} />
            <Input label="Employer Name" name="employerName" value={form.employerName} onChange={handleChange} inputClass={inputClass} />
            <Textarea label="Office Address" name="officeAddress" value={form.officeAddress} onChange={handleChange} inputClass={inputClass} />
          </div>
        )
      case 'Financial Profile':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Outstanding Amount" name="outstandingAmount" type="number" value={form.outstandingAmount} onChange={handleChange} inputClass={inputClass} />
            <Input label="Principal Amount" name="principalAmount" type="number" value={form.principalAmount} onChange={handleChange} inputClass={inputClass} />
            <Input label="Last Payment Amount" name="lastPaymentAmount" type="number" value={form.lastPaymentAmount} onChange={handleChange} inputClass={inputClass} />
            <Input label="Last Payment Date" name="lastPaymentDate" type="date" value={form.lastPaymentDate} onChange={handleChange} inputClass={inputClass} />
            <Input label="Total Paid" name="totalPaid" type="number" value={form.totalPaid} onChange={handleChange} inputClass={inputClass} />
          </div>
        )
      case 'Related Info':
        return (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Emergency Contacts</h3>
            {form.Relations.map((contact, idx) => (
              <div key={idx} className="border p-3 rounded mb-3 relative bg-gray-50 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(idx)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  aria-label={`Remove emergency contact #${idx + 1}`}
                >
                  <FaTrash />
                </button>
                <Input label="Name" value={contact.relationName} onChange={e => updateEmergencyContact(idx, 'relationName', e.target.value)} inputClass={inputClass} />
                <Input label="Relationship" value={contact.relationshipType} onChange={e => updateEmergencyContact(idx, 'relationshipType', e.target.value)} inputClass={inputClass} />
                <Input label="Phone" value={contact.relationPhone} onChange={e => updateEmergencyContact(idx, 'relationPhone', e.target.value.replace(/\D/g, ''))} inputClass={inputClass} />
              </div>
            ))}
            <button type="button" onClick={addEmergencyContact} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              + Add emergency contact
            </button>

            <h3 className="font-semibold text-lg mt-6 mb-2 text-gray-800 dark:text-gray-200">Bank Accounts</h3>
            {form.BankAccounts.map((bank, idx) => (
              <div key={idx} className="border p-3 rounded mb-3 relative bg-gray-50 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => removeBankAccount(idx)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  aria-label={`Remove bank account #${idx + 1}`}
                >
                  <FaTrash />
                </button>
                <Input label="Bank Name" value={bank.bankName} onChange={e => updateBankAccount(idx, 'bankName', e.target.value)} inputClass={inputClass} />
                <Input label="Account Type" value={bank.accountType} onChange={e => updateBankAccount(idx, 'accountType', e.target.value)} inputClass={inputClass} />
                <Input label="Account Number" value={bank.accountNumber} onChange={e => updateBankAccount(idx, 'accountNumber', e.target.value)} inputClass={inputClass} />
                <Input label="Account Holder" value={bank.accountHolder} onChange={e => updateBankAccount(idx, 'accountHolder', e.target.value)} inputClass={inputClass} />
              </div>
            ))}
            <button type="button" onClick={addBankAccount} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              + Add bank account
            </button>
          </div>
        )
      case 'Status & Forecast':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Status" name="status" value={form.status} onChange={handleChange} options={statusOptions} inputClass={inputClass} />
            <Select label="Forecast" name="forecast" value={form.forecast} onChange={handleChange} options={forecastOptions} inputClass={inputClass} />
            <div className="form-group">
              <label htmlFor="nextFollowUpDate" className="block">
                Next Follow-Up Date
                {form.status === 'Promise to Pay' && <span className="text-red-600">*</span>}
              </label>
              <input
                type="date"
                id="nextFollowUpDate"
                name="nextFollowUpDate"
                value={form.nextFollowUpDate}
                onChange={handleChange}
                className={inputClass}
                min={new Date().toISOString().split('T')[0]} // Disable past dates
              />
              {nextFollowUpDateError && (
                <p className="text-red-600">{nextFollowUpDateError}</p>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(form)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-900 rounded shadow">
      {renderTabs()}
      <div className="mb-6">{renderTab()}</div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded font-semibold"
      >
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}

function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  inputClass,
}: {
  label: string
  name?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  inputClass?: string
}) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
    </div>
  )
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
  inputClass,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  inputClass?: string
}) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={inputClass}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function Textarea({
  label,
  name,
  value,
  onChange,
  inputClass,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  inputClass?: string
}) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={inputClass}
        rows={3}
      />
    </div>
  )
}
