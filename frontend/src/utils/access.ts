import type { UserInfo } from '../types/auth';

export const canManageRbac = (user: UserInfo | null | undefined) => {
  if (!user) {
    return false;
  }

  return user.roles.includes('admin')
    || user.permissions.includes('rbac:manage')
    || user.permissions.includes('permissions:manage');
};
