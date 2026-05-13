import React from 'react';

interface ConsolePageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export default function ConsolePageHeader({
  title,
  subtitle,
  actions,
  eyebrow = '算法平台',
}: ConsolePageHeaderProps) {
  return (
    <header className="console-page-header" role="banner">
      <div className="console-page-header__copy">
        <p className="console-page-header__eyebrow" aria-hidden="true">{eyebrow}</p>
        <h1 className="console-page-header__title">{title}</h1>
        <p className="console-page-header__subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="console-page-header__actions" role="toolbar" aria-label="页面操作">{actions}</div> : null}
    </header>
  );
}
