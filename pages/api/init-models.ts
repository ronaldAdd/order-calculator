// lib/init-models.ts
import User from '@/models/user-ts'; // Pastikan model User sudah ada
import Debtor from '@/models/debtor-ts';
import Relations from '@/models/relations-ts';
import BankAccount from '@/models/bank-account-ts';
import CallHistory from '@/models/call-history-ts';

let initialized = false;

export default async function initModels() {
  if (initialized) return;

  console.log('📦 Initializing models...');
  
  try {
    // Sinkronisasi model User terlebih dahulu
    await User.sync({ force: false });
    console.log('✅ User model synced');
    
    // Sinkronisasi model lainnya
    await Debtor.sync({ force: false });
    await BankAccount.sync({ force: false });
    await Relations.sync({ force: false });
    
    // Sinkronisasi model CallHistory setelah User
    await CallHistory.sync({ force: false });
    console.log('✅ Models synchronized');
    
  } catch (error) {
    console.error('Error during model initialization:', error);
  }

  initialized = true;
}
