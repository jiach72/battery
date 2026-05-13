import React from 'react';
import { Button, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import { getAlgorithm } from './catalog';

export default function AlgorithmComparePage() {
  const navigate = useNavigate();
  const params = useParams();
  const algorithm = getAlgorithm(params.method);
  const versions = algorithm.versions || [];
  const [left, right] = versions;

  if (!left || !right) {
    return (
      <div className="space-y-5">
        <ConsolePageHeader
          title={`${algorithm.name} 版本对比`}
          subtitle="当前还没有可对比的版本。"
        />
        <ConsolePanel title="提示">
          <div className="space-y-2">
            <div className="console-context-item__label">这个算法目前只有单一版本，先补版本元数据再做切换。</div>
            <Button type="primary" onClick={() => navigate(`/algorithms/${algorithm.method}`)}>
              返回详情
            </Button>
          </div>
        </ConsolePanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title={`${algorithm.name} 版本对比`}
        subtitle="把当前版本和预留版本并排摆出来，方便看算法差异。"
        actions={(
          <div className="console-status-pill">
            <span className="console-status-pill__label">算法</span>
            <span className="console-status-pill__value">{algorithm.method}</span>
          </div>
        )}
      />

      <div className="console-grid-hero">
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">左侧</span>
            <span className="console-status-pill__value">{left.version} · {left.method}</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">右侧</span>
            <span className="console-status-pill__value">{right.version} · {right.method}</span>
          </div>
        </div>
        <div data-span="4">
          <div className="console-status-pill">
            <span className="console-status-pill__label">关联页</span>
            <span className="console-status-pill__value">{algorithm.relatedPages.join(' / ')}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[left, right].map((version) => (
          <ConsolePanel
            key={version.version}
            title={version.version}
            subtitle={version.note}
            extra={<Tag color={version.version === 'v1' ? 'green' : 'blue'}>{version.method}</Tag>}
          >
            <div className="space-y-3">
              <div className="console-context-item">
                <div className="console-context-item__label">样例输入</div>
                <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">
                  {version.sampleInput}
                </pre>
              </div>
              <div className="console-context-item">
                <div className="console-context-item__label">样例输出</div>
                <pre className="mt-2 overflow-auto rounded-xl bg-[var(--console-soft)] p-3 text-[11px] leading-5 text-[var(--console-text)]">
                  {version.sampleOutput}
                </pre>
              </div>
            </div>
          </ConsolePanel>
        ))}
      </div>

      <ConsolePanel title="差异说明" subtitle="版本对比时最应该看的东西。">
        <div className="space-y-2">
          <div className="console-context-item__label">1. 输入是否新增字段</div>
          <div className="console-context-item__label">2. 输出是否增加置信度 / 解释字段</div>
          <div className="console-context-item__label">3. 结论风险等级是否变化</div>
          <div className="console-context-item__label">4. 结果是否更适合当前场景</div>
        </div>
      </ConsolePanel>

      <ConsolePanel title="跳转">
        <div className="flex flex-wrap gap-2">
          <Button type="primary" onClick={() => navigate(`/algorithms/${algorithm.method}`)}>
            返回详情
          </Button>
          <Button onClick={() => navigate(algorithm.route)}>
            打开产品页
          </Button>
          <Button onClick={() => navigate('/algorithms')}>
            回到目录
          </Button>
        </div>
      </ConsolePanel>
    </div>
  );
}
