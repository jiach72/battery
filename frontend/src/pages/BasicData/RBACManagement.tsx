import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { rbacApi, type User, type Role } from '../../api/rbac';
import { usePagination } from '../../hooks/usePagination';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';

const roleMeta: Record<string, { label: string; dotClassName: string }> = {
  admin: { label: '管理员', dotClassName: 'console-status-pill__dot--accent' },
  operator: { label: '运维人员', dotClassName: 'console-status-pill__dot--warning' },
};

export default function RBACManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const { pagination, setTotal, antdPagination } = usePagination(10);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rbacApi.getUsers({ page: pagination.page - 1, size: pagination.pageSize });
      const page = data as { content?: User[]; totalElements?: number };
      setUsers(page.content || (Array.isArray(data) ? data : []));
      setTotal(page.totalElements || (Array.isArray(data) ? data.length : 0));
    } catch {
      message.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, setTotal]);

  const loadRoles = useCallback(async () => {
    try {
      const data = await rbacApi.getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      // roles load failed silently
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  const handleCreateUser = async () => {
    try {
      const values = await userForm.validateFields();
      await rbacApi.createUser(values);
      message.success('用户创建成功');
      setUserModalOpen(false);
      userForm.resetFields();
      loadUsers();
    } catch {
      // validation error
    }
  };

  const handleUpdateUser = async () => {
    try {
      const values = await userForm.validateFields();
      if (editingUser) {
        await rbacApi.updateUser(editingUser.id, values);
        message.success('用户更新成功');
        setUserModalOpen(false);
        setEditingUser(null);
        userForm.resetFields();
        loadUsers();
      }
    } catch {
      // validation error
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await rbacApi.deleteUser(id);
      message.success('用户已删除');
      loadUsers();
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleEnabled = async (user: User) => {
    try {
      await rbacApi.updateUser(user.id, { enabled: !user.enabled });
      message.success(user.enabled ? '用户已禁用' : '用户已启用');
      loadUsers();
    } catch {
      message.error('操作失败');
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      username: user.username,
      displayName: user.displayName,
      roleIds: user.roles.map((r) => r.id || r.code),
    });
    setUserModalOpen(true);
  };

  const openCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalOpen(true);
  };

  // Role management
  const handleCreateRole = async () => {
    try {
      const values = await roleForm.validateFields();
      await rbacApi.createRole(values);
      message.success('角色创建成功');
      setRoleModalOpen(false);
      roleForm.resetFields();
      loadRoles();
    } catch {
      // validation error
    }
  };

  const handleUpdateRole = async () => {
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        await rbacApi.updateRole(editingRole.id, values);
        message.success('角色更新成功');
        setRoleModalOpen(false);
        setEditingRole(null);
        roleForm.resetFields();
        loadRoles();
      }
    } catch {
      // validation error
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await rbacApi.deleteRole(id);
      message.success('角色已删除');
      loadRoles();
    } catch {
      message.error('删除失败');
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      name: role.name,
      code: role.code,
      menuIds: role.menus?.map((m) => m.id) || [],
    });
    setRoleModalOpen(true);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setRoleModalOpen(true);
  };

  const enabledCount = users.filter((user) => user.enabled).length;
  const roleSummary = Array.from(new Set(users.flatMap((user) => user.roles.map((r) => r.code || r.name))));

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '显示名', dataIndex: 'displayName', key: 'displayName' },
    {
      title: '角色',
      key: 'roles',
      render: (_: unknown, record: User) => (
        <div className="flex flex-wrap gap-2">
          {(record.roles || []).map((role) => {
            const code = role.code || role.name;
            const meta = roleMeta[code] || { label: role.name || code, dotClassName: 'console-status-pill__dot--accent' };
            return (
              <div key={role.id || code} className="console-status-pill">
                <span className="console-status-pill__label">
                  <span className={`console-status-pill__dot ${meta.dotClassName}`} />
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: User) => (
        <Switch checked={enabled} size="small" onChange={() => handleToggleEnabled(record)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <div className="flex gap-2">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditUser(record)}>编辑</Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDeleteUser(record.id)} okText="确定" cancelText="取消">
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const roleColumns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code' },
    {
      title: '菜单权限',
      key: 'menus',
      render: (_: unknown, record: Role) => (
        <span className="text-[13px] text-[var(--console-text-soft)]">
          {(record.menus || []).length} 个菜单
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Role) => (
        <div className="flex gap-2">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditRole(record)}>编辑</Button>
          <Popconfirm title="确定删除该角色？" onConfirm={() => handleDeleteRole(record.id)} okText="确定" cancelText="取消">
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="权限控制"
        subtitle="为值班、运维与管理角色提供清晰的账号与权限映射视图。"
        actions={
          <>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                权限模型
              </span>
              <span className="console-status-pill__value">RBAC</span>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateUser}>新增用户</Button>
          </>
        }
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="账户数量" value={`${users.length} 个`} hint="当前系统可用账号数" /></div>
        <div data-span="4"><ConsoleMetricTile label="启用账户" value={`${enabledCount} 个`} hint="当前可登录值守账号" tone="positive" /></div>
        <div data-span="4"><ConsoleMetricTile label="角色覆盖" value={`${roleSummary.length} 类`} hint={roleSummary.join(' / ')} /></div>
      </div>

      <ConsolePanel
        title="账户与角色"
        subtitle="管理系统用户账号及其角色权限分配。"
        extra={
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className="console-status-pill__dot console-status-pill__dot--success" />
              已启用
            </span>
            <span className="console-status-pill__value">{enabledCount} 个账户</span>
          </div>
        }
      >
        <Tabs
          items={[
            {
              key: 'users',
              label: '用户管理',
              children: (
                <div className="console-table-shell">
                  <Table dataSource={users} columns={userColumns} rowKey="id" size="small" loading={loading} pagination={antdPagination} />
                </div>
              ),
            },
            {
              key: 'roles',
              label: '角色管理',
              children: (
                <div>
                  <div className="mb-3">
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateRole}>新建角色</Button>
                  </div>
                  <div className="console-table-shell">
                    <Table dataSource={roles} columns={roleColumns} rowKey="id" size="small" pagination={false} />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </ConsolePanel>

      {/* User create/edit modal */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={userModalOpen}
        onOk={editingUser ? handleUpdateUser : handleCreateUser}
        onCancel={() => { setUserModalOpen(false); setEditingUser(null); userForm.resetFields(); }}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="displayName" label="显示名" rules={[{ required: true, message: '请输入显示名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select
              mode="multiple"
              placeholder="选择角色"
              options={roles.map((role) => ({ value: role.id, label: role.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Role create/edit modal */}
      <Modal
        title={editingRole ? '编辑角色' : '新建角色'}
        open={roleModalOpen}
        onOk={editingRole ? handleUpdateRole : handleCreateRole}
        onCancel={() => { setRoleModalOpen(false); setEditingRole(null); roleForm.resetFields(); }}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="menuIds" label="菜单权限">
            <Select mode="multiple" placeholder="选择菜单" options={[]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
