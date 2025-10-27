export type Role = 'admin' | 'user';

export const rolePermissions: Record<Role, string[]> = {
  admin: ['create', 'read', 'update', 'delete'],
  user: ['read',  'update'],
};
