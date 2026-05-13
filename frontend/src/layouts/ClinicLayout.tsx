import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs as AntTabs } from 'antd';
import {
  MedicineBoxOutlined,
  ProfileOutlined,
  LineChartOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Outlet } from 'react-router-dom';

const tabItems = [
  { key: '/clinic/overview', label: '多维评估总览', icon: <ProfileOutlined /> },
  { key: '/clinic/detail', label: '单体下钻分析', icon: <LineChartOutlined /> },
  { key: '/clinic/capacity', label: '容量分析', icon: <DashboardOutlined /> },
  { key: '/clinic/mileage', label: '里程分析', icon: <MedicineBoxOutlined /> },
  { key: '/clinic/safety', label: '安全评估', icon: <SafetyCertificateOutlined /> },
  { key: '/clinic/efficiency', label: '效率分析', icon: <ThunderboltOutlined /> },
];

export default function ClinicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = location.pathname;

  return (
    <div className="console-clinic-shell">
      <div className="console-clinic-header">
        <div>
          <p className="console-page-header__eyebrow">Diagnostics</p>
          <h2 className="console-clinic-title">诊断中心</h2>
        </div>
        <div className="console-side-note">围绕 SOH、风险、一致性和效率，快速切换分析视角。</div>
      </div>

      <div className="console-clinic-tabs">
        <AntTabs
          activeKey={activeKey}
          onChange={(key) => navigate(key)}
          items={tabItems}
          className="console-clinic-tabs__nav"
          size="small"
          aria-label="诊断中心导航"
        />
      </div>

      <div className="console-clinic-body">
        <Outlet />
      </div>
    </div>
  );
}
