import User from './user-ts';
import Debtor from './debtor-ts';
import BankAccount from './bank-account-ts';
import Relation from './relations-ts';

export function initAssociations() {
  // Relasi antara Debtor dan User
  // User memiliki banyak Debtor (alias 'assignedDebtors')
  User.hasMany(Debtor, { foreignKey: 'assignedCollector', sourceKey: 'id', as: 'collectorInfo' });

  // Debtor memiliki satu User (collector) (alias 'collectorInfo')
  // Ganti alias menjadi 'collectorInfo' untuk menghindari bentrok dengan field 'assignedCollector'
  Debtor.belongsTo(User, { foreignKey: 'assignedCollector', targetKey: 'id', as: 'collectorInfo' });

  // Relasi antara Debtor dan BankAccount (one-to-many)
  Debtor.hasMany(BankAccount, { foreignKey: 'debtorId', sourceKey: 'id', as: 'accounts' });
  BankAccount.belongsTo(Debtor, { foreignKey: 'debtorId', targetKey: 'id', as: 'debtor' });

  // Relasi antara Debtor dan Relation (one-to-many)
  Debtor.hasMany(Relation, { foreignKey: 'debtorId', sourceKey: 'id', as: 'relations' });
  Relation.belongsTo(Debtor, { foreignKey: 'debtorId', targetKey: 'id', as: 'debtor' });
}
