import React, { useId } from 'react';

interface ConsolePanelProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export default function ConsolePanel({
  title,
  subtitle,
  extra,
  children,
  className = '',
  eyebrow = 'Section',
}: ConsolePanelProps) {
  const titleId = useId();

  return (
    <section
      className={`console-panel ${className}`}
      role="region"
      aria-labelledby={titleId}
    >
      <header className="console-panel__header">
        <div className="console-panel__heading">
          <p className="console-panel__eyebrow" aria-hidden="true">{eyebrow}</p>
          <h3 className="console-panel__title" id={titleId}>{title}</h3>
          {subtitle ? <p className="console-panel__subtitle">{subtitle}</p> : null}
        </div>
        {extra ? <div className="console-panel__extra">{extra}</div> : null}
      </header>
      <div className="console-panel__body">{children}</div>
    </section>
  );
}
