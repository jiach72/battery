import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const logoGlyph = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="6" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 3V6M19 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="console-auth-shell">
      <aside className="console-auth-hero">
        <div className="console-auth-hero__brand">
          <div className="console-auth-hero__mark">{logoGlyph}</div>
          <div>
            <div className="console-auth-hero__eyebrow">电池健康管理算法平台</div>
            <div className="console-auth-hero__wordmark">算法值守工作台</div>
          </div>
        </div>

        <div className="console-auth-hero__copy">
          <h1 className="console-auth-hero__title">
            把电站运维
            <br />
            收进一个工作台
          </h1>
          <p className="console-auth-hero__description">
            以站级态势、单体诊断和告警闭环为核心，让值班与分析共用同一套操作界面。
          </p>
          <div className="console-auth-hero__metrics">
            <div className="console-auth-hero__metric">
              <div className="console-auth-hero__metric-value console-auth-hero__metric-value--accent">01</div>
              <div className="console-auth-hero__metric-label">统一监测</div>
            </div>
            <div className="console-auth-hero__metric">
              <div className="console-auth-hero__metric-value console-auth-hero__metric-value--success">02</div>
              <div className="console-auth-hero__metric-label">诊断协同</div>
            </div>
            <div className="console-auth-hero__metric">
              <div className="console-auth-hero__metric-value console-auth-hero__metric-value--warning">03</div>
              <div className="console-auth-hero__metric-label">告警闭环</div>
            </div>
          </div>
        </div>

        <div className="console-auth-hero__footnote">
          © 2026 电池健康管理算法平台
        </div>
      </aside>

      <div className="console-auth-stage">
        <div className="console-auth-panel">
          <div className="console-auth-panel__header">
            <div className="console-auth-panel__brand">
              <div className="console-auth-panel__mark">{logoGlyph}</div>
              <div>
                <div className="console-auth-panel__eyebrow">电池健康管理算法平台</div>
                <div className="console-auth-panel__wordmark">算法值守工作台</div>
              </div>
            </div>
            <h2 className="console-auth-panel__title">欢迎回来</h2>
            <p className="console-auth-panel__subtitle">登录后进入算法总览与诊断工作台</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
