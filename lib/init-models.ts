import User from '@/models/user-ts';
import Debtor from '@/models/debtor-ts';
import Relations from '@/models/relations-ts';
import BankAccount from '@/models/bank-account-ts';
import CallHistory from '@/models/call-history-ts';
import IngestionTemplate from '@/models/ingestion-template-ts'; // ⬅️ Tambahkan model ini
import AuditTrail from '@/models/audit-trail-ts';
import CallLog from '@/models/call-log';
import TwilioSetting from '@/models/twilio-setting';

let initialized = false;

export default async function initModels() {
  if (initialized) return;

  console.log('📦 Initializing models...');

  // Sinkronkan model-user terlebih dahulu
  await User.sync({ force: false });   // Sinkronkan tabel User
  console.log('✅ User model initialized');

  // Sinkronkan model lainnya, dengan memastikan urutannya yang benar
  await Debtor.sync({ force: false }); // Sinkronkan tabel Debtor
  console.log('✅ Debtor model initialized');
  
  await BankAccount.sync({ force: false }); // Sinkronkan tabel BankAccount
  console.log('✅ BankAccount model initialized');
  
  await Relations.sync({ force: false }); // Sinkronkan tabel Relations
  console.log('✅ Relations model initialized');
  
  await CallHistory.sync({ force: false }); // Sinkronkan tabel CallHistory
  console.log('✅ CallHistory model initialized');

    // ⬇️ Sinkronkan model IngestionTemplate (baru)
  await IngestionTemplate.sync({ force: false });
  console.log('✅ IngestionTemplate model initialized');

    // ⬇️ Sinkronkan model AuditTrail (baru)
  await AuditTrail.sync({ force: false });
  console.log('✅ AuditTrail model initialized');

    // ⬇️ Sinkronkan model AuditTrail (baru)
  await CallLog.sync({ force: false });
  console.log('✅ CallLog model initialized');

    // ⬇️ Sinkronkan model AuditTrail (baru)
  await TwilioSetting.sync({ force: false });
  console.log('✅ TwilioSetting model initialized');

  initialized = true;
}
