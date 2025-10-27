import User from './user-ts';
import Debtor from './debtor-ts';
import BankAccount from './bank-account-ts';
import Relation from './relations-ts';
import CallHistory from './call-history-ts'; 

export function initAssociations() {
  // Relasi antara Debtor dan User
  // User memiliki banyak Debtor (alias 'assignedDebtors')
  User.hasMany(Debtor, { foreignKey: 'assignedCollector', sourceKey: 'id' });

  // Debtor memiliki satu User (collector) (alias 'collectorInfo')
  // Ganti alias menjadi 'collectorInfo' untuk menghindari bentrok dengan field 'assignedCollector'
  Debtor.belongsTo(User, { foreignKey: 'assignedCollector', targetKey: 'id'});

  // Relasi antara Debtor dan BankAccount (one-to-many)
  Debtor.hasMany(BankAccount, { foreignKey: 'debtorId', sourceKey: 'id', onDelete: 'CASCADE', constraints: true });
  BankAccount.belongsTo(Debtor, { foreignKey: 'debtorId', targetKey: 'id', onDelete: 'CASCADE'});

  // Relasi antara Debtor dan Relation (one-to-many)
  Debtor.hasMany(Relation, { foreignKey: 'debtorId', sourceKey: 'id', onDelete: 'CASCADE', constraints: true });
  Relation.belongsTo(Debtor, { foreignKey: 'debtorId', targetKey: 'id', onDelete: 'CASCADE'});

  // Relasi antara CallHistory dan Debtor (many-to-one)
  CallHistory.belongsTo(Debtor, { foreignKey: 'debtorId', targetKey: 'id' });

  // CallHistory - User (collector)
  CallHistory.belongsTo(User, { foreignKey: 'collectorId', targetKey: 'id' });

  // Relasi antara CallHistory dan User (many-to-one, collector)
  // CallHistory.belongsTo(User, { foreignKey: 'collectorId', targetKey: 'id' });

}
