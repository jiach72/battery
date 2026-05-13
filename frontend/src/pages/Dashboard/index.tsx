import React, { useEffect } from 'react';
import { Button, Table, message } from 'antd';
import { ArrowRightOutlined, SafetyOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOverview, fetchRealtimeClusters } from '../../store/slices/dashboardSlice';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import RiskBadge from '../../components/RiskBadge';
import PowerCurveChart from '../../charts/PowerCurveChart';
import SocHeatmap from '../../charts/SocHeatmap';
import TopIndicators from '../../components/TopIndicators';
import PageEmpty from '../../components/PageEmpty';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { overview, realtimeClusters, selectedStation, error } = useAppSelector((state) => state.dashboard);
  const { events } = useAppSelector((state) => state.alarm);

  // fetchOverview 和 fetchAlarmEvents 已在 MainLayout 挂载时统一调度，此处仅补充实时簇数据
  useEffect(() => {
    dispatch(fetchRealtimeClusters(selectedStation));
  }, [dispatch, selectedStation]);

  const retry = () => {
    dispatch(fetchOverview(selectedStation));
    dispatch(fetchRealtimeClusters(selectedStation));
  };

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const topClusters = realtimeClusters.slice(0, 6).map((cluster) => ({
    key: cluster.clusterId,
    clusterName: `簇 ${cluster.clusterNo}`,
    voltage: cluster.cells[0]?.voltage ?? 3.24,
    current: cluster.cells[0]?.current ?? 96.8,
    soc: cluster.cells[0]?.soc ?? 68.2,
    temperature: cluster.cells[0]?.temperature ?? 31.4,
    status: (cluster.cells[0]?.temperature ?? 0) > 32 ? '预警' : '稳定',
  }));
  const unackCount = events.filter((event) => event.status === 'UNACK').length;
  const warningClusterCount = topClusters.filter((cluster) => cluster.status === '预警').length;
  const workflowCards = [
    {
      title: '先处理告警',
      description: '优先关闭未确认和高危事件，避免噪音扩散。',
      count: `${unackCount} 条待办`,
      tone: 'danger',
      action: '去告警列表',
      href: '/alarm',
      icon: <SafetyOutlined />,
    },
    {
      title: '再看平台态势',
      description: '总览功率、SOC、收益和温度分布。',
      count: `${warningClusterCount} 个预警簇`,
      tone: 'warning',
      action: '去总览页',
      href: '/dashboard/realtime',
      icon: <SyncOutlined />,
    },
    {
      title: '最后做诊断下钻',
      description: '进入诊断中心看 SOH、风险和一致性。',
      count: '诊断 / 安全',
      tone: 'positive',
      action: '去诊断中心',
      href: '/clinic/overview',
      icon: <ArrowRightOutlined />,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="算法总览"
        subtitle="值班第一屏：先看平台态势，再看关键簇，再看高优先级告警。"
        actions={
          <div className="console-status-pill">
            <span className="console-status-pill__label">
              <span className="console-status-pill__dot console-status-pill__dot--accent" />
              数据刷新
            </span>
            <span className="console-status-pill__value">
              <SyncOutlined spin /> {overview?.lastUpdateTime || '--'}
            </span>
          </div>
        }
      />

      {/* Section 1: Workflow guidance */}
      <ConsolePanel
        title="值守路径"
        subtitle="把算法、诊断和告警动作按先后顺序组织起来，减少值班员来回切换页面的成本。"
      >
        <div className="console-workflow-grid">
          {workflowCards.map((card, index) => (
            <button
              key={card.title}
              type="button"
              className={`console-workflow-card console-workflow-card--${card.tone}`}
              onClick={() => navigate(card.href)}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="console-workflow-card__header">
                <span className="console-workflow-card__icon">{card.icon}</span>
                <span className="console-workflow-card__count">{card.count}</span>
              </div>
              <div className="console-workflow-card__body">
                <div className="console-workflow-card__title">{card.title}</div>
                <div className="console-workflow-card__description">{card.description}</div>
              </div>
              <div className="console-workflow-card__action">
                <span>{card.action}</span>
                <ArrowRightOutlined />
              </div>
            </button>
          ))}
        </div>
      </ConsolePanel>

      {/* Section 2: Key indicators */}
      <TopIndicators
        data={{
          totalDays: 427,
          dailyCharge: overview?.dailyCharge,
          dailyDischarge: overview?.dailyDischarge,
          totalCapacity: overview?.totalCapacity,
          realTimePower: 318,
          ratedPower: 512,
        }}
      />

      {/* Section 3: Charts & summary */}
      <div className="console-grid-two">
        <ConsolePanel
          title="功率轨迹"
          subtitle="关注充放电节奏、功率阶跃和站级负载变化。"
        >
          <div className="console-chart-frame">
            <PowerCurveChart height={380} />
          </div>
        </ConsolePanel>

        <ConsolePanel
          title="值守摘要"
          subtitle="用最少的信息快速判断当前是否需要立即处理。"
        >
          <div className="space-y-3">
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--danger" />
                高危告警
              </span>
              <span className="console-status-pill__value">{overview?.alarmCount?.high ?? 0} 条</span>
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--warning" />
                中危告警
              </span>
              <span className="console-status-pill__value">{overview?.alarmCount?.medium ?? 0} 条</span>
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--success" />
                当前收益
              </span>
              <span className="console-status-pill__value">¥{overview?.revenueToday ?? 0}</span>
            </div>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                月收益预测
              </span>
              <span className="console-status-pill__value">¥{overview?.forecastRevenueMonth ?? 0}</span>
            </div>
            <div className="console-side-note">
              当前建议：优先关注簇 4 与簇 7 的温升和末端压差，如继续抬升则切换保守运行策略。
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="primary" size="small" onClick={() => message.success('已记录切换保守策略建议')}>
                切换保守策略
              </Button>
              <Button size="small" onClick={() => navigate('/alarm')}>
                查看处置队列
              </Button>
            </div>
          </div>
        </ConsolePanel>
      </div>

      {/* Section 4: Deep analysis */}
      <div className="console-grid-two">
        <ConsolePanel
          title="SOC 热区"
          subtitle="快速识别低 SOC 区域与不均衡簇。"
        >
          <div className="console-chart-frame">
            <SocHeatmap height={500} />
          </div>
        </ConsolePanel>

        <ConsolePanel
          title="关键簇状态"
          subtitle="值班场景下最常盯的簇级状态汇总表。"
        >
          <div className="console-table-shell">
            <Table
              dataSource={topClusters}
              pagination={false}
              size="middle"
              rowKey="key"
              columns={[
                { title: '簇', dataIndex: 'clusterName', key: 'clusterName' },
                { title: '电压(V)', dataIndex: 'voltage', key: 'voltage', render: (value: number) => value.toFixed(3) },
                { title: '电流(A)', dataIndex: 'current', key: 'current', render: (value: number) => value.toFixed(1) },
                { title: 'SOC(%)', dataIndex: 'soc', key: 'soc', render: (value: number) => value.toFixed(1) },
                {
                  title: '温度(℃)',
                  dataIndex: 'temperature',
                  key: 'temperature',
                  sorter: (a, b) => b.temperature - a.temperature,
                  render: (value: number) => value.toFixed(1),
                },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                  render: (value: string) => (
                    <div className="console-status-pill">
                      <span className="console-status-pill__label">
                        <span className={`console-status-pill__dot ${value === '预警' ? 'console-status-pill__dot--warning' : 'console-status-pill__dot--success'}`} />
                        {value}
                      </span>
                    </div>
                  ),
              },
              ]}
            />
          </div>
        </ConsolePanel>
      </div>

      {/* Section 5: Alarm queue */}
      <ConsolePanel
        title="当前高优先级告警"
        subtitle="进入系统后最应该先看的事件队列。"
      >
        <div className="console-table-shell">
          <Table
            dataSource={events.slice(0, 6)}
            pagination={false}
            rowKey="id"
            rowClassName={(record) => `alarm-row alarm-row--${record.severity}`}
            columns={[
              { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
              { title: '规则', dataIndex: 'ruleName', key: 'ruleName' },
              { title: '设备', dataIndex: 'deviceName', key: 'deviceName' },
              {
                title: '级别',
                dataIndex: 'severity',
                key: 'severity',
                render: (value: string) => <RiskBadge severity={value === 'high' || value === 'medium' || value === 'low' ? value : 'low'} />,
              },
              {
                title: '触发值',
                dataIndex: 'triggerValue',
                key: 'triggerValue',
                render: (value: number | undefined, record) => value != null ? `${value.toFixed(3)}${record.ruleName.includes('温') ? ' ℃' : ''}` : '-',
              },
            ]}
          />
        </div>
      </ConsolePanel>
    </div>
  );
}
