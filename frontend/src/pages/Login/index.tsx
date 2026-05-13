import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await signIn(values.username, values.password).unwrap();
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const values = { username: 'admin', password: 'admin123' };
    localStorage.setItem('demoMode', 'true');
    form.setFieldsValue(values);
    void onFinish(values);
  };

  return (
    <div className="space-y-5">
      <div className="console-soft-section space-y-2">
        <div className="console-field__label">DEMO ACCESS</div>
        <div className="text-[14px] font-semibold text-[var(--console-title)]">admin / admin123</div>
        <div className="text-[13px] leading-[1.6] text-[var(--console-text-soft)]">
          无后端环境会自动进入演示数据模式，便于验收工作台流程。
        </div>
        <Button onClick={handleDemoLogin} loading={loading} block>
          一键体验
        </Button>
      </div>

      {error ? <Alert message={error} type="error" showIcon className="console-login-alert" /> : null}

      <Form
        form={form}
        onFinish={onFinish}
        size="large"
        layout="vertical"
        initialValues={{ username: 'admin', password: 'admin123' }}
        requiredMark={false}
        aria-label="用户登录"
        validateTrigger={['onBlur', 'onChange']}
      >
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少 3 个字符' }]}>
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 个字符' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={loading} block className="h-11">
            进入工作台
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
