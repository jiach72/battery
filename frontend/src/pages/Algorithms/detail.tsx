import React, { useMemo } from 'react';
import { Button, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import { getAlgorithm } from './catalog';

export default function AlgorithmDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const algorithm = useMemo(() => getAlgorithm(params.method), [params.method]);

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title={`${algorithm.name} 详情`}
        subtitle="把输入、输出、方法和入口页一次性展开，方便客户和研发对齐。"
        actions={(
          <div className="console-status-pill">
            <span className="console-status-pill__label">方法名</span>
            <span className="console-status-pill__value">{algorithm.method}</span>
          </div>
        )}
      />

      <div className="console-grid-hero">
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">版本</span>
            <span className="console-status-pill__value">{algorithm.version}</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">状态</span>
            <span className="console-status-pill__value">{algorithm.status}</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">场景</span>
            <span className="console-status-pill__value">{algorithm.scenario}</span>
          </div>
        </div>
      </div>

      <ConsolePanel title="算法说明" subtitle={algorithm.note}>
        <div className="space-y-3">
          <div className="console-context-item">
            <div className="console-context-item__label">输入</div>
            <div className="text-[12px] text-[var(--console-text)]">{algorithm.input}</div>
          </div>
          <div className="console-context-item">
            <div className="console-context-item__label">输出</div>
            <div className="text-[12px] text-[var(--console-text)]">{algorithm.output}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="console-context-item">
              <div className="console-context-item__label">样例输入</div>
              <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">{algorithm.sampleInput}</pre>
            </div>
            <div className="console-context-item">
              <div className="console-context-item__label">样例输出</div>
              <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">{algorithm.sampleOutput}</pre>
            </div>
          </div>
        </div>
      </ConsolePanel>

      <ConsolePanel title="相关页面" subtitle="这个算法在产品里对应哪里看。">
        <div className="flex flex-wrap gap-2">
          {algorithm.relatedPages.map((page) => (
            <Button key={page} onClick={() => navigate(page)}>
              {page}
            </Button>
          ))}
          {algorithm.versions ? (
            <Button onClick={() => navigate(`/algorithms/${algorithm.method}/compare`)}>
              版本对比
            </Button>
          ) : null}
          <Button type="primary" onClick={() => navigate('/algorithms')}>
            返回目录
          </Button>
          <Tag color="blue">可扩展切换/对比</Tag>
        </div>
      </ConsolePanel>
    </div>
  );
}
