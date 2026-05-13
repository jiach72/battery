import React from 'react';
import { Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

/** 路由 → 面包屑映射 */
const routeMap: Record<string, string> = {
  '/dashboard': '算法总览',
  '/dashboard/realtime': '实时工况',
  '/clinic': '诊断中心',
  '/clinic/overview': '健康评估总览',
  '/clinic/detail': '单体下钻分析',
  '/clinic/capacity': '容量分析',
  '/clinic/mileage': '里程分析',
  '/clinic/safety': '安全评估',
  '/clinic/efficiency': '效率分析',
  '/diagnosis': '故障诊断',
  '/alarm': '告警列表',
  '/alarm/rules': '告警规则配置',
  '/om': '运维优化模拟',
  '/basic-data': '资产配置',
  '/basic-data/devices': '设备台账',
  '/basic-data/analog': '模拟量映射',
  '/basic-data/telemetry': '设备接入',
  '/basic-data/permissions': '权限控制',
};

export default function AppBreadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathSnippets = location.pathname.split('/').filter(Boolean);

  const items: NonNullable<BreadcrumbProps['items']> = [{
    title: <HomeOutlined />,
    href: '/dashboard',
    onClick: (e: React.MouseEvent) => { e.preventDefault(); navigate('/dashboard'); },
  }];

  pathSnippets.forEach((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const label = routeMap[url];
    if (!label) return;
    items.push({
      title: label,
      href: url,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); navigate(url); },
    });
  });

  if (items.length <= 1) return null;

  return (
    <Breadcrumb
      items={items}
      className="mb-3 text-[13px]"
    />
  );
}
