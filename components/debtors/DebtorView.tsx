'use client'

import React from 'react'
import { DebtorFormData } from './DebtorForm'

type Props = {
  data: DebtorFormData
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold mb-2 border-b pb-1">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-base">{value || <span className="text-gray-400 italic">N/A</span>}</p>
  </div>
)

export default function DebtorView({ data }: Props) {

  console.log(data,'DebtorView');
  
  
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded shadow print:shadow-none print:p-0 print:bg-white text-sm">
      <h1 className="text-2xl font-semibold mb-6 text-center">Debtor Profile</h1>

      <Section title="Personal Information">
        <Row label="First Name" value={data.firstName} />
        <Row label="Last Name" value={data.lastName} />
        <Row label="Sex" value={data.sex} />
        <Row label="Date of Birth" value={data.dob} />
        <Row label="National ID" value={data.nationalId} />
        <Row label="Religion" value={data.religion} />
        <Row label="Marital Status" value={data.maritalStatus} />
      </Section>

      <Section title="Contact Information">
        <Row label="Email" value={data.email} />
        <Row label="Home Phone" value={data.homePhone} />
        <Row label="Office Phone" value={data.officePhone} />
        <Row label="Mobile Phones" value={data.mobilePhones.join(', ')} />
        <Row label="Address" value={data.address} />
      </Section>

      <Section title="Employment Information">
        <Row label="Job Title" value={data.jobTitle} />
        <Row label="Employer Name" value={data.employerName} />
        <Row label="Office Address" value={data.officeAddress} />
      </Section>

      <Section title="Loan/Product Information">
        <Row label="Product Name" value={data.productName} />
        <Row label="Loan ID" value={data.loanId} />

        <Row label="Outstanding Amount" value={`Rp ${Number(data.outstandingAmount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} />
        <Row label="Principal Amount" value={`Rp ${Number(data.principalAmount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} />
        <Row label="Last Payment Amount" value={`Rp ${Number(data.lastPaymentAmount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} />
        <Row label="Last Payment Date" value={data.lastPaymentDate} />
        <Row label="Total Paid" value={`Rp ${Number(data.totalPaid || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} />

      </Section>

      <Section title="Status & Forecast">
        <Row label="Status" value={data.status} />
        <Row label="Forecast" value={data.forecast} />
        <Row label="Next Follow-up Date" value={data.nextFollowUpDate} />
        <Row label="Assigned Collector" value={data.User?.name} />
      </Section>

      <Section title="Emergency Contacts">
        {(data.Relations || []).map((c, i) => (
          <div key={i} className="border p-2 rounded mb-2 col-span-2">
            <Row label="Name" value={c.relationName} />
            <Row label="Relationship" value={c.relationshipType} />
            <Row label="Phone" value={c.relationPhone} />
          </div>
        ))}
      </Section>

      <Section title="Bank Accounts">
        {(data.BankAccounts || []).map((b, i) => (
          <div key={i} className="border p-2 rounded mb-2 col-span-2">
            <Row label="Bank Name" value={b.bankName} />
            <Row label="Account Number" value={b.accountNumber} />
            <Row label="Account Holder" value={b.accountHolder} />
          </div>
        ))}
      </Section>

      {/* <div className="text-center mt-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
        >
          Print
        </button>
      </div> */}
    </div>
  )
}


export type { DebtorFormData as DebtorViewData }