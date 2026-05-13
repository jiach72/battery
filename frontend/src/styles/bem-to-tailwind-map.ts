/**
 * BEM-to-Tailwind mapping for console-* classes.
 *
 * Usage: When migrating a component from BEM to Tailwind, replace the
 * className string with the Tailwind equivalent below, then remove the
 * BEM class definition from index.css.
 *
 * Example:
 *   Before: <div className="console-panel">
 *   After:  <div className="border border-[var(--console-border-subtle)] bg-gradient-to-b from-[var(--console-panel-grad-start)] to-[var(--console-panel-grad-end)] shadow-[var(--console-shadow)] rounded-[22px] overflow-hidden">
 */

export const bemToTailwind = {
  /* ── App Shell ─────────────────────────────────────── */
  'console-app':
    'min-h-screen text-[var(--console-text)]',
  'console-app--dark':
    'dark',
  'console-app--light':
    '',

  /* ── Layout Grid ───────────────────────────────────── */
  'console-shell':
    'relative grid grid-cols-[296px_minmax(0,1fr)] gap-4 p-4 min-h-[calc(100vh-104px)]',
  'console-sidebar':
    'border border-[var(--console-border-subtle)] bg-gradient-to-b from-[var(--console-panel-grad-start)] to-[var(--console-panel-grad-end)] flex flex-col p-5 gap-3.5 sticky top-[88px] rounded-3xl shadow-[var(--console-shadow)] min-h-[calc(100vh-116px)] h-[calc(100vh-116px)] overflow-auto z-5',
  'console-main':
    'min-w-0 pb-6',

  /* ── Topbar ─────────────────────────────────────────── */
  'console-topbar':
    'grid grid-cols-[minmax(260px,1fr)_auto_auto] items-center gap-5 min-h-[88px] p-4 pt-4 mx-4 mt-4 border border-[var(--console-border-subtle)] rounded-3xl bg-gradient-to-b from-[var(--console-bg-chrome)] to-[var(--console-bg-panel)] backdrop-blur-xl shadow-[var(--console-shadow)] sticky top-4 z-20',
  'console-topbar__brand':
    'min-w-0 pt-px',
  'console-topbar__cluster':
    'flex items-center gap-3 flex-wrap',
  'console-topbar__actions':
    'flex items-center gap-3 flex-wrap justify-end',
  'console-topbar__theme-toggle':
    'h-11 px-4 !rounded-2xl border-[var(--console-border-soft)] bg-[var(--console-bg-soft)] text-[var(--console-text)]',

  /* ── Brand ──────────────────────────────────────────── */
  'console-brand__eyebrow':
    'font-[family-name:var(--console-font-body)] text-[var(--console-text-2xs)] font-semibold leading-[var(--console-leading-title)] tracking-[0.08em] text-[var(--console-accent)]',
  'console-brand__title':
    'font-[family-name:var(--console-font-display)] tracking-[var(--console-tracking-title)] text-[var(--console-title)] text-balance text-[21px] font-bold leading-[1.12] mb-2.5',
  'console-brand__subtitle':
    'text-[var(--console-text-soft)] text-base font-normal leading-relaxed max-w-[34ch]',

  /* ── Page Header ────────────────────────────────────── */
  'console-page-header':
    'flex justify-between items-start gap-6 mb-[18px] p-0.5',
  'console-page-header__copy':
    'max-w-[68ch]',
  'console-page-header__eyebrow':
    'font-[family-name:var(--console-font-body)] text-[var(--console-text-2xs)] font-semibold leading-[var(--console-leading-title)] tracking-[0.08em] text-[var(--console-accent)]',
  'console-page-header__title':
    'font-[family-name:var(--console-font-display)] tracking-[var(--console-tracking-title)] text-[var(--console-title)] text-balance text-[36px] font-bold leading-[1.08] mt-2 mb-3',
  'console-page-header__subtitle':
    'text-[var(--console-text-soft)] text-base font-normal leading-relaxed',
  'console-page-header__actions':
    'flex gap-3 items-center flex-wrap',

  /* ── Clinic Layout ──────────────────────────────────── */
  'console-clinic-shell':
    'flex flex-col gap-[18px]',
  'console-clinic-header':
    'flex justify-between gap-5 items-end p-0.5',
  'console-clinic-title':
    'mt-2 text-[var(--console-title)] font-[family-name:var(--console-font-display)] text-[30px] font-bold leading-[1.08] tracking-[-0.03em]',
  'console-clinic-tabs':
    'border border-[var(--console-border-subtle)] rounded-[22px] bg-gradient-to-b from-[var(--console-bg-panel)] to-[var(--console-surface-section)] shadow-[0_12px_28px_rgba(2,8,20,0.16)] pt-2.5 px-3',
  'console-clinic-tabs__nav': '',
  'console-clinic-body':
    'min-w-0',

  /* ── Panel ──────────────────────────────────────────── */
  'console-panel':
    'border border-[var(--console-border-subtle)] bg-gradient-to-b from-[var(--console-panel-grad-start)] to-[var(--console-panel-grad-end)] shadow-[var(--console-shadow)] rounded-[22px] overflow-hidden',
  'console-panel__header':
    'flex justify-between items-start gap-4 p-5 pb-3.5 border-b border-[var(--console-border-subtle)]',
  'console-panel__heading':
    'min-w-0',
  'console-panel__eyebrow':
    'font-[family-name:var(--console-font-body)] text-[var(--console-text-2xs)] font-semibold leading-[var(--console-leading-title)] tracking-[0.08em] text-[var(--console-accent)]',
  'console-panel__title':
    'mt-2 font-[family-name:var(--console-font-body)] text-[19px] font-bold leading-[1.18] text-[var(--console-title)] tracking-[var(--console-tracking-title)]',
  'console-panel__subtitle':
    'text-[var(--console-text-soft)] text-base font-normal leading-relaxed max-w-[64ch] mt-1.5',
  'console-panel__extra':
    'flex items-center gap-2.5 flex-wrap',
  'console-panel__body':
    'p-[18px_20px_20px]',

  /* ── Metric Tile ────────────────────────────────────── */
  'console-metric':
    'relative overflow-hidden min-h-[124px] p-4 pb-3.5 rounded-[20px] border border-[var(--console-border-subtle)] bg-gradient-to-b from-[var(--console-metric-grad-start)] to-[var(--console-metric-grad-end)] flex flex-col justify-between gap-3 shadow-[0_12px_28px_rgba(2,8,20,0.12)]',
  'console-metric--positive':
    'border-[var(--console-success-soft)]',
  'console-metric--warning':
    'border-[var(--console-warning-soft)]',
  'console-metric--danger':
    'border-[var(--console-danger-soft)]',
  'console-metric__content':
    'flex flex-col gap-2.5',
  'console-metric__label':
    'font-[family-name:var(--console-font-body)] text-[var(--console-text-xs)] font-semibold leading-[var(--console-leading-title)] tracking-[var(--console-tracking-label)] text-[var(--console-text-soft)] uppercase',
  'console-metric__value':
    'font-[family-name:var(--console-font-body)] text-[32px] font-bold leading-none text-[var(--console-title)] tracking-[-0.04em] tabular-nums inline-flex items-baseline gap-2',
  'console-metric__trend':
    'text-base font-semibold leading-none',
  'console-metric__hint':
    'text-[var(--console-text-soft)] text-[var(--console-text-sm)] leading-relaxed',

  /* ── Status Pill ────────────────────────────────────── */
  'console-status-pill':
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--console-border-subtle)] bg-[var(--console-bg-soft)] text-[var(--console-text-sm)] text-[var(--console-text-soft)]',
  'console-status-pill__dot':
    'w-1.5 h-1.5 rounded-full',

  /* ── Workflow Card ──────────────────────────────────── */
  'console-workflow-card':
    'p-3 rounded-xl border border-[var(--console-border-subtle)] bg-[var(--console-bg-soft)] cursor-pointer transition-all duration-200 hover:border-[var(--console-border-strong)] hover:bg-[var(--console-bg-panel)]',
  'console-workflow-card__icon':
    'text-lg mb-1',
  'console-workflow-card__label':
    'text-[var(--console-text-sm)] font-semibold text-[var(--console-title)]',
  'console-workflow-card__desc':
    'text-[var(--console-text-xs)] text-[var(--console-text-soft)] mt-0.5',

  /* ── KPI Grid ───────────────────────────────────────── */
  'console-grid-hero':
    'grid grid-cols-12 gap-4',
  'console-kpi-stack':
    'flex flex-col gap-4',
  'console-kpi-rail':
    'grid grid-cols-2 gap-4',

  /* ── Chart & Table Frames ───────────────────────────── */
  'console-chart-frame':
    'w-full min-h-[280px]',
  'console-table-shell':
    'w-full overflow-x-auto',
  'console-tree-shell':
    'w-full',

  /* ── Auth Layout ────────────────────────────────────── */
  'console-auth-shell':
    'grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-screen',
  'console-auth-hero':
    'hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-[var(--console-accent-soft)] to-transparent',
  'console-auth-panel':
    'flex items-center justify-center p-8',
} as const;

export type BemClass = keyof typeof bemToTailwind;
