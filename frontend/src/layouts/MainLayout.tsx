import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Button, Select, Tooltip } from 'antd';
import {
  ApartmentOutlined,
  BellOutlined,
  BgColorsOutlined,
  DashboardOutlined,
  FundProjectionScreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RadarChartOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAlarmEvents } from '../store/slices/alarmSlice';
import { setAlarmCenterOpen } from '../store/slices/alarmSlice';
import { fetchOverview, setSelectedStation } from '../store/slices/dashboardSlice';
import { canManageRbac } from '../utils/access';
import DemoModeBanner from '../components/DemoModeBanner';
import AppBreadcrumb from '../components/AppBreadcrumb';
import { isDemoMode } from '../utils/apiError';
import AlarmCenter from '../components/AlarmCenter';

/** 扁平化导航项 */
const navItems = [
  { key: '/dashboard', label: '算法总览', icon: <DashboardOutlined />, group: '总览' },
  { key: '/clinic/overview', label: '健康评估', icon: <RadarChartOutlined />, group: '总览' },
  { key: '/clinic/detail', label: '单体分析', icon: <FundProjectionScreenOutlined />, group: '诊断' },
  { key: '/clinic/capacity', label: '容量分析', icon: <FundProjectionScreenOutlined />, group: '诊断' },
  { key: '/clinic/mileage', label: '里程分析', icon: <FundProjectionScreenOutlined />, group: '诊断' },
  { key: '/clinic/safety', label: '安全评估', icon: <SafetyOutlined />, group: '诊断' },
  { key: '/clinic/efficiency', label: '效率分析', icon: <FundProjectionScreenOutlined />, group: '诊断' },
  { key: '/diagnosis', label: '故障诊断', icon: <ExperimentOutlined />, group: '诊断' },
  { key: '/algorithms', label: '算法目录', icon: <ExperimentOutlined />, group: '诊断' },
  { key: '/alarm', label: '告警列表', icon: <BellOutlined />, group: '运维' },
  { key: '/alarm/rules', label: '告警规则', icon: <SettingOutlined />, group: '运维' },
  { key: '/om', label: '运维模拟', icon: <FundProjectionScreenOutlined />, group: '运维' },
  { key: '/basic-data/devices', label: '设备台账', icon: <ApartmentOutlined />, group: '资产' },
  { key: '/basic-data/analog', label: '模拟量映射', icon: <ApartmentOutlined />, group: '资产' },
  { key: '/basic-data/telemetry', label: '设备接入', icon: <ApartmentOutlined />, group: '资产' },
  { key: '/basic-data/permissions', label: '权限控制', icon: <SettingOutlined />, group: '资产', requiredRoles: ['admin'] },
];

const STATION_OPTIONS = [
  { value: 'eu-1', label: '北区 1 号站' },
  { value: 'eu-2', label: '东区 2 号站' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { overview, selectedStation } = useAppSelector((state) => state.dashboard);
  const { unreadCount } = useAppSelector((state) => state.alarm);
  const canAccessRbac = canManageRbac(user);
  const [refreshInterval, setRefreshInterval] = useState(300000);

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    dispatch(fetchOverview(selectedStation));
    dispatch(fetchAlarmEvents({}));
    if (!refreshInterval) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      dispatch(fetchOverview(selectedStation));
      dispatch(fetchAlarmEvents({}));
    }, refreshInterval);

    return () => window.clearInterval(timer);
  }, [dispatch, selectedStation, refreshInterval]);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.requiredRoles?.includes('admin') && !canAccessRbac) return false;
      return true;
    });
  }, [canAccessRbac]);

  const activeKey = useMemo(() => {
    return visibleNavItems.find((item) => location.pathname === item.key)?.key
      || visibleNavItems.find((item) => location.pathname.startsWith(item.key))?.key
      || '/dashboard';
  }, [location.pathname, visibleNavItems]);

  /** 按 group 分组 */
  const groupedNav = useMemo(() => {
    const groups: { label: string; items: typeof visibleNavItems }[] = [];
    let currentGroup = '';
    for (const item of visibleNavItems) {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        groups.push({ label: currentGroup, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [visibleNavItems]);

  return (
    <div className={`console-app ${isDark ? 'console-app--dark' : 'console-app--light'}`}>
      <a href="#main-content" className="skip-to-content">跳转到主要内容</a>

      {/* ─── 顶部栏（紧凑单行） ─── */}
      <header className="console-topbar">
        <Button
          type="text"
          size="small"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setMobileNavOpen(true)}
          className="console-topbar__menu-btn"
          aria-label="打开导航"
        />

        {/* 品牌 */}
        <div className="console-topbar__brand">
          <span className="text-[15px] font-bold text-[var(--console-title)] tracking-tight">
            电池健康平台
          </span>
        </div>

        {/* 中间：站点 + 告警 + 更新 */}
        <div className="console-topbar__cluster">
          <div className="console-topbar__station">
            <span className="console-topbar__station-label">站点</span>
            <Select
              value={selectedStation}
              size="small"
              variant="borderless"
              popupMatchSelectWidth={false}
              onChange={(value) => dispatch(setSelectedStation(value))}
              options={STATION_OPTIONS}
              className="min-w-[120px]"
            />
          </div>

          <button
            type="button"
            className="console-topbar__alarm"
            onClick={() => dispatch(setAlarmCenterOpen(true))}
          >
            <Badge count={unreadCount} size="small" offset={[2, -2]}>
              <BellOutlined className="text-[16px]" />
            </Badge>
            <span className="console-topbar__alarm-label">告警</span>
          </button>

          <div className="console-topbar__update">
            <span className="console-status-pill__dot console-status-pill__dot--success" />
            <span className="text-[12px] text-[var(--console-text-soft)] tabular-nums">
              {overview?.lastUpdateTime || '--'}
            </span>
            <Select
              aria-label="自动刷新间隔"
              size="small"
              variant="borderless"
              value={refreshInterval}
              popupMatchSelectWidth={false}
              onChange={setRefreshInterval}
              options={[
                { value: 60000, label: '1分钟' },
                { value: 300000, label: '5分钟' },
                { value: 600000, label: '10分钟' },
                { value: 0, label: '手动' },
              ]}
              className="min-w-[76px]"
            />
          </div>
        </div>

        <div className="console-topbar__actions">
          <Tooltip title={isDark ? '切换浅色' : '切换深色'}>
            <Button
              type="text"
              size="small"
              icon={<BgColorsOutlined />}
              onClick={toggle}
              className="console-topbar__icon-btn"
            />
          </Tooltip>
          <div className="console-topbar__user">
            <Avatar size={24} icon={<UserOutlined />} />
            <span className="text-[13px] text-[var(--console-text)] hidden sm:inline">
              {user?.displayName || '值班'}
            </span>
          </div>
        </div>
      </header>

      {isDemoMode() && <DemoModeBanner />}
      <AlarmCenter />

      {/* ─── 主体区域 ─── */}
      <div className={`console-shell ${collapsed ? 'console-shell--collapsed' : ''}`}>
        {/* 侧边栏 */}
        {mobileNavOpen ? (
          <button
            type="button"
            className="console-mobile-nav-backdrop"
            aria-label="关闭导航"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside className={`console-sidebar ${mobileNavOpen ? 'console-sidebar--mobile-open' : ''}`} role="navigation" aria-label="主导航">
          {/* 折叠按钮 */}
          <button
            type="button"
            className="console-sidebar__collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          {/* 导航项 */}
          <nav className="console-sidebar__nav">
            {groupedNav.map((group) => (
              <div key={group.label} className="console-sidebar__group">
                {!collapsed && (
                  <div className="console-sidebar__group-label">{group.label}</div>
                )}
                {group.items.map((item) => {
                  const isActive = activeKey === item.key;
                  const btn = (
                    <button
                      type="button"
                      key={item.key}
                      className={`console-sidebar__item ${isActive ? 'console-sidebar__item--active' : ''}`}
                      onClick={() => { navigate(item.key); setMobileNavOpen(false); }}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(item.key); setMobileNavOpen(false); } }}
                    >
                      <span className="console-sidebar__item-icon">{item.icon}</span>
                      {!collapsed && (
                        <span className="console-sidebar__item-label">{item.label}</span>
                      )}
                      {isActive && <span className="console-sidebar__item-indicator" />}
                    </button>
                  );

                  return collapsed ? (
                    <Tooltip key={item.key} title={item.label} placement="right">
                      {btn}
                    </Tooltip>
                  ) : btn;
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* 内容区 */}
        <main className="console-main" id="main-content">
          <AppBreadcrumb />
          <div className="console-page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
