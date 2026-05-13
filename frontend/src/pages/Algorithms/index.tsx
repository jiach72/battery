import React from 'react';
import { Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import { algorithms } from './catalog';

export default function AlgorithmsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="算法目录"
        subtitle="把现有算法按版本、方法、场景和样例一次性列清楚。"
      />

      <div className="console-grid-hero">
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">已存在</span>
            <span className="console-status-pill__value">6 个</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">新增</span>
            <span className="console-status-pill__value">1 个</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">入口页</span>
            <span className="console-status-pill__value">诊断 / 总览 / 运维</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {algorithms.map((item) => (
          <ConsolePanel
            key={item.method}
            title={item.name}
            subtitle={`${item.scenario} · ${item.method}`}
            extra={<Tag color={item.status === '新增' ? 'blue' : 'green'}>{item.version} · {item.status}</Tag>}
          >
            <div className="space-y-3">
              <div className="console-context-item">
                <div className="console-context-item__label">输入</div>
                <div className="text-[12px] text-[var(--console-text)]">{item.input}</div>
              </div>
              <div className="console-context-item">
                <div className="console-context-item__label">输出</div>
                <div className="text-[12px] text-[var(--console-text)]">{item.output}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="console-context-item">
                  <div className="console-context-item__label">样例输入</div>
                  <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">
                    {item.sampleInput}
                  </pre>
                </div>
                <div className="console-context-item">
                  <div className="console-context-item__label">样例输出</div>
                  <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">
                    {item.sampleOutput}
                  </pre>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="primary" size="small" onClick={() => navigate(item.route)}>
                  打开入口
                </Button>
                <Button size="small" onClick={() => navigate(`/algorithms/${item.method}`)}>
                  详情
                </Button>
                {item.versions ? (
                  <Button size="small" onClick={() => navigate(`/algorithms/${item.method}/compare`)}>
                    版本对比
                  </Button>
                ) : null}
                <Button size="small" onClick={() => navigate('/diagnosis')}>
                  看诊断页
                </Button>
              </div>
            </div>
          </ConsolePanel>
        ))}
      </div>
    </div>
  );
}
