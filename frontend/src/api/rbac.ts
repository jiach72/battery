import client from './client';

export interface User {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  enabled: boolean;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  menus: Menu[];
}

export interface Menu {
  id: string;
  name: string;
  path: string;
}

export const rbacApi = {
  getUsers: (params?: { page?: number; size?: number }) =>
    client.get('/rbac/users', { params }),

  createUser: (data: { username: string; password: string; displayName: string; roleIds: string[] }) =>
    client.post('/rbac/users', data),

  updateUser: (id: string, data: Partial<User>) =>
    client.put(`/rbac/users/${id}`, data),

  deleteUser: (id: string) =>
    client.delete(`/rbac/users/${id}`),

  getRoles: () =>
    client.get('/rbac/roles'),

  createRole: (data: { name: string; code: string; menuIds: string[] }) =>
    client.post('/rbac/roles', data),

  updateRole: (id: string, data: Partial<Role>) =>
    client.put(`/rbac/roles/${id}`, data),

  deleteRole: (id: string) =>
    client.delete(`/rbac/roles/${id}`),

  getMenus: () =>
    client.get('/rbac/menus'),
};
