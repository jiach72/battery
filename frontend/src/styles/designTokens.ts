export const brandTokens = {
  primary: '#5b8cff',
  primaryHover: '#7aa4ff',
  primaryTint: '#9fc0ff',
  primaryTextLight: '#0f2d66',
  primaryTextDark: '#ecf3ff',
} as const;

export const semanticTokens = {
  success: '#2fbf83',
  warning: '#f0a33a',
  danger: '#f25f5c',
} as const;

/** Energy/power accent colors for battery/charge indicators */
export const energyTokens = {
  electric: '#22d3a7',
  electricHover: '#3ee8bd',
  electricSoft: 'rgba(34, 211, 167, 0.18)',
  charge: '#ffb020',
  chargeHover: '#ffc24d',
  chargeSoft: 'rgba(255, 176, 32, 0.18)',
} as const;

export const typographyTokens = {
  fontBody: "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  fontDisplay: "'Space Grotesk', 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  /* Type scale - aligned with menu bar (11px labels, 13px body, 15px nav) */
  text2Xs: '10px',   // 很少使用
  textXs: '11px',    // 标签、说明文字、overline
  textSm: '13px',    // 正文、侧边栏项、表格内容
  textBase: '14px',  // 主内容正文
  textLg: '16px',    // 强调正文、面板标题
  headingSm: '18px', // 小标题
  headingMd: '22px', // 中标题
  headingLg: '28px', // 大标题
  displaySm: '32px', // 展示文字
  displayMd: '40px', // 大展示
  displayLg: '52px', // 超大展示
  lineHeightDisplay: '1.12',
  lineHeightTitle: '1.28',
  lineHeightBody: '1.55',
  lineHeightRelaxed: '1.7',
  letterSpacingLabel: '0.06em',
  letterSpacingEyebrow: '0.1em',
  letterSpacingTitle: '-0.02em',
  letterSpacingDisplay: '-0.028em',
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
} as const;

/** Spacing scale - 4px base unit */
export const spacingTokens = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

/** Border-radius scale */
export const radiusTokens = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

/** Elevation / shadow system */
export const shadowTokens = {
  light: {
    none: 'none',
    sm: '0 1px 3px rgba(12, 22, 38, 0.06), 0 1px 2px rgba(12, 22, 38, 0.04)',
    md: '0 4px 12px rgba(12, 22, 38, 0.08), 0 2px 4px rgba(12, 22, 38, 0.04)',
    lg: '0 12px 28px rgba(12, 22, 38, 0.10), 0 4px 8px rgba(12, 22, 38, 0.04)',
    xl: '0 20px 52px rgba(12, 22, 38, 0.14), 0 8px 16px rgba(12, 22, 38, 0.06)',
  },
  dark: {
    none: 'none',
    sm: '0 0 0 1px rgba(91, 140, 255, 0.06), 0 2px 6px rgba(1, 6, 15, 0.25)',
    md: '0 0 0 1px rgba(91, 140, 255, 0.08), 0 6px 16px rgba(1, 6, 15, 0.35)',
    lg: '0 0 0 1px rgba(91, 140, 255, 0.10), 0 14px 32px rgba(1, 6, 15, 0.42)',
    xl: '0 0 0 1px rgba(91, 140, 255, 0.12), 0 26px 64px rgba(1, 6, 15, 0.50)',
  },
} as const;

/** Transition presets */
export const transitionTokens = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
} as const;

export const surfaceTokens = {
  light: {
    layout: '#dce5ee',
    container: '#f7f9fc',
    chrome: '#eef3f8',
    rail: '#e4ebf4',
    soft: '#edf2f8',
    table: '#eaf0f6',
    rowHover: '#dfe8f2',
    text: '#0f1b2d',
    textSecondary: '#4a5e78',
    border: '#c3cfdd',
  },
  dark: {
    layout: '#06111d',
    container: '#0b1524',
    chrome: '#09101c',
    rail: '#09121d',
    soft: '#101b2b',
    table: '#0f1a2a',
    rowHover: '#142233',
    text: '#e8eef7',
    textSecondary: '#8ea0b9',
    border: '#233349',
  },
} as const;

export const consoleVariableSets: {
  base: Record<string, string>;
  dark: Record<string, string>;
  light: Record<string, string>;
} = {
  base: {
    /* Typography */
    '--console-font-body': typographyTokens.fontBody,
    '--console-font-display': typographyTokens.fontDisplay,
    '--console-text-2xs': typographyTokens.text2Xs,
    '--console-text-xs': typographyTokens.textXs,
    '--console-text-sm': typographyTokens.textSm,
    '--console-text-base': typographyTokens.textBase,
    '--console-text-lg': typographyTokens.textLg,
    '--console-heading-sm': typographyTokens.headingSm,
    '--console-heading-md': typographyTokens.headingMd,
    '--console-heading-lg': typographyTokens.headingLg,
    '--console-display-sm': typographyTokens.displaySm,
    '--console-display-md': typographyTokens.displayMd,
    '--console-display-lg': typographyTokens.displayLg,
    '--console-leading-display': typographyTokens.lineHeightDisplay,
    '--console-leading-title': typographyTokens.lineHeightTitle,
    '--console-leading-body': typographyTokens.lineHeightBody,
    '--console-leading-relaxed': typographyTokens.lineHeightRelaxed,
    '--console-tracking-label': typographyTokens.letterSpacingLabel,
    '--console-tracking-eyebrow': typographyTokens.letterSpacingEyebrow,
    '--console-tracking-title': typographyTokens.letterSpacingTitle,
    '--console-tracking-display': typographyTokens.letterSpacingDisplay,
    '--console-weight-regular': typographyTokens.fontWeightRegular,
    '--console-weight-medium': typographyTokens.fontWeightMedium,
    '--console-weight-semibold': typographyTokens.fontWeightSemibold,
    '--console-weight-bold': typographyTokens.fontWeightBold,
    /* Spacing */
    '--console-space-0': spacingTokens[0],
    '--console-space-1': spacingTokens[1],
    '--console-space-2': spacingTokens[2],
    '--console-space-3': spacingTokens[3],
    '--console-space-4': spacingTokens[4],
    '--console-space-5': spacingTokens[5],
    '--console-space-6': spacingTokens[6],
    '--console-space-8': spacingTokens[8],
    '--console-space-10': spacingTokens[10],
    '--console-space-12': spacingTokens[12],
    '--console-space-16': spacingTokens[16],
    '--console-space-20': spacingTokens[20],
    '--console-space-24': spacingTokens[24],
    /* Radius */
    '--console-radius-sm': radiusTokens.sm,
    '--console-radius-md': radiusTokens.md,
    '--console-radius-lg': radiusTokens.lg,
    '--console-radius-xl': radiusTokens.xl,
    '--console-radius-2xl': radiusTokens['2xl'],
    '--console-radius-full': radiusTokens.full,
    /* Transitions */
    '--console-transition-fast': transitionTokens.fast,
    '--console-transition-normal': transitionTokens.normal,
    '--console-transition-slow': transitionTokens.slow,
    /* Energy accent */
    '--console-electric': energyTokens.electric,
    '--console-electric-hover': energyTokens.electricHover,
    '--console-electric-soft': energyTokens.electricSoft,
    '--console-charge': energyTokens.charge,
    '--console-charge-hover': energyTokens.chargeHover,
    '--console-charge-soft': energyTokens.chargeSoft,
  },
  dark: {
    '--console-bg': '#06111d',
    '--console-bg-raised': '#0b1524',
    '--console-bg-soft': '#101b2b',
    '--console-bg-panel': 'rgba(11, 21, 36, 0.96)',
    '--console-bg-chrome': 'rgba(9, 16, 28, 0.92)',
    '--console-bg-rail': 'rgba(9, 18, 29, 0.96)',
    '--console-border': 'rgba(160, 180, 206, 0.18)',
    '--console-border-subtle': 'rgba(160, 180, 206, 0.12)',
    '--console-border-soft': 'rgba(160, 180, 206, 0.16)',
    '--console-border-strong': 'rgba(91, 140, 255, 0.34)',
    '--console-text': '#e8eef7',
    '--console-text-soft': '#8ea0b9',
    '--console-title': '#f6faff',
    '--console-accent': '#6b96ff',
    '--console-accent-hover': '#91b3ff',
    '--console-accent-soft': 'rgba(107, 150, 255, 0.16)',
    '--console-accent-tint': 'rgba(107, 150, 255, 0.1)',
    '--console-accent-fill': 'rgba(107, 150, 255, 0.2)',
    '--console-accent-ring': 'rgba(107, 150, 255, 0.18)',
    '--console-warning': '#f0a33a',
    '--console-danger': '#f25f5c',
    '--console-success': '#2fbf83',
    '--console-success-soft': 'rgba(47, 191, 131, 0.22)',
    '--console-warning-soft': 'rgba(240, 163, 58, 0.22)',
    '--console-danger-soft': 'rgba(242, 95, 92, 0.22)',
    '--console-success-strong': 'rgba(47, 191, 131, 0.42)',
    '--console-warning-strong': 'rgba(240, 163, 58, 0.42)',
    '--console-danger-strong': 'rgba(242, 95, 92, 0.42)',
    '--console-shadow': shadowTokens.dark.lg,
    '--console-shadow-sm': shadowTokens.dark.sm,
    '--console-shadow-md': shadowTokens.dark.md,
    '--console-shadow-lg': shadowTokens.dark.lg,
    '--console-shadow-xl': shadowTokens.dark.xl,
    '--console-grid': 'rgba(160, 180, 206, 0.05)',
    '--console-panel-grad-start': 'rgba(14, 24, 39, 0.98)',
    '--console-panel-grad-end': 'rgba(9, 18, 30, 0.96)',
    '--console-metric-grad-start': 'rgba(15, 26, 43, 0.98)',
    '--console-metric-grad-end': 'rgba(11, 20, 33, 0.96)',
    '--console-chart-surface': 'rgba(8, 16, 28, 0.86)',
    '--console-row-hover': 'rgba(20, 34, 51, 0.96)',
    '--console-surface-hover': 'rgba(20, 34, 51, 0.62)',
    '--console-surface-elevated': 'rgba(14, 24, 39, 0.9)',
    '--console-surface-selected': 'rgba(15, 26, 42, 0.98)',
    '--console-surface-section': 'rgba(12, 22, 36, 0.78)',
    '--console-body-glow-primary': 'rgba(107, 150, 255, 0.12)',
    '--console-body-glow-secondary': 'rgba(47, 191, 131, 0.06)',
    '--console-body-bg-start': '#07111d',
    '--console-body-bg-end': '#091725',
  },
  light: {
    '--console-bg': '#d8e1eb',
    '--console-bg-raised': '#f8fafc',
    '--console-bg-soft': '#e9eff6',
    '--console-bg-panel': 'rgba(249, 251, 253, 0.96)',
    '--console-bg-chrome': 'rgba(241, 246, 251, 0.96)',
    '--console-bg-rail': 'rgba(231, 238, 246, 0.98)',
    '--console-border': 'rgba(91, 107, 129, 0.24)',
    '--console-border-subtle': 'rgba(91, 107, 129, 0.14)',
    '--console-border-soft': 'rgba(91, 107, 129, 0.18)',
    '--console-border-strong': 'rgba(78, 130, 242, 0.24)',
    '--console-text': '#0f1b2d',
    '--console-text-soft': '#45586e',
    '--console-title': '#08111d',
    '--console-accent': '#4e82f2',
    '--console-accent-hover': '#6d9bff',
    '--console-accent-soft': 'rgba(78, 130, 242, 0.11)',
    '--console-accent-tint': 'rgba(78, 130, 242, 0.07)',
    '--console-accent-fill': 'rgba(78, 130, 242, 0.13)',
    '--console-accent-ring': 'rgba(78, 130, 242, 0.14)',
    '--console-warning': '#b87a1a',
    '--console-danger': '#d44340',
    '--console-success': '#228c5e',
    '--console-success-soft': 'rgba(47, 191, 131, 0.18)',
    '--console-warning-soft': 'rgba(240, 163, 58, 0.18)',
    '--console-danger-soft': 'rgba(242, 95, 92, 0.16)',
    '--console-success-strong': 'rgba(34, 140, 94, 0.42)',
    '--console-warning-strong': 'rgba(184, 122, 26, 0.42)',
    '--console-danger-strong': 'rgba(212, 67, 64, 0.42)',
    '--console-shadow': shadowTokens.light.lg,
    '--console-shadow-sm': shadowTokens.light.sm,
    '--console-shadow-md': shadowTokens.light.md,
    '--console-shadow-lg': shadowTokens.light.lg,
    '--console-shadow-xl': shadowTokens.light.xl,
    '--console-grid': 'rgba(91, 107, 129, 0.05)',
    '--console-panel-grad-start': 'rgba(255, 255, 255, 0.98)',
    '--console-panel-grad-end': 'rgba(241, 245, 250, 0.96)',
    '--console-metric-grad-start': 'rgba(255, 255, 255, 0.99)',
    '--console-metric-grad-end': 'rgba(244, 248, 252, 0.98)',
    '--console-chart-surface': 'rgba(239, 244, 250, 0.94)',
    '--console-row-hover': 'rgba(229, 236, 244, 0.98)',
    '--console-surface-hover': 'rgba(229, 236, 244, 0.78)',
    '--console-surface-elevated': 'rgba(250, 252, 254, 0.92)',
    '--console-surface-selected': 'rgba(244, 248, 252, 0.98)',
    '--console-surface-section': 'rgba(252, 253, 255, 0.9)',
    '--console-body-glow-primary': 'rgba(78, 130, 242, 0.08)',
    '--console-body-glow-secondary': 'rgba(47, 191, 131, 0.04)',
    '--console-body-bg-start': '#f4f7fb',
    '--console-body-bg-end': '#dbe4ee',
  },
};
