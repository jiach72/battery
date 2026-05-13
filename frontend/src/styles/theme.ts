import type { ThemeConfig } from 'antd';
import {
  brandTokens,
  semanticTokens,
  energyTokens,
  surfaceTokens,
  typographyTokens,
  radiusTokens,
  shadowTokens,
  transitionTokens,
} from './designTokens.ts';

export {
  brandTokens,
  semanticTokens,
  energyTokens,
  surfaceTokens,
  typographyTokens,
  radiusTokens,
  shadowTokens,
  transitionTokens,
};

export const chartSeriesTokens = {
  primary: brandTokens.primary,
  secondary: semanticTokens.success,
  tertiary: semanticTokens.warning,
  emphasis: brandTokens.primaryTint,
  electric: energyTokens.electric,
  charge: energyTokens.charge,
};

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(128, 128, 128, ${alpha})`;
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16) || 128;
  const g = Number.parseInt(normalized.slice(2, 4), 16) || 128;
  const b = Number.parseInt(normalized.slice(4, 6), 16) || 128;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const riskToneTokens = {
  high: { color: 'var(--console-danger)', soft: 'var(--console-danger-soft)', strong: 'var(--console-danger-strong)', text: '高风险' },
  medium: { color: 'var(--console-warning)', soft: 'var(--console-warning-soft)', strong: 'var(--console-warning-strong)', text: '中风险' },
  low: { color: 'var(--console-success)', soft: 'var(--console-success-soft)', strong: 'var(--console-success-strong)', text: '低风险' },
} as const;

const lightSurfaces = surfaceTokens.light;
const darkSurfaces = surfaceTokens.dark;

export const getChartTheme = (isDark: boolean) => {
  const surface = isDark ? darkSurfaces : lightSurfaces;

  return {
    axisText: surface.textSecondary,
    tooltipBackground: isDark ? 'rgba(15, 24, 37, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? 'rgba(91, 140, 255, 0.18)' : 'rgba(91, 107, 129, 0.18)',
    tooltipText: surface.text,
    splitLine: isDark ? 'rgba(160, 180, 206, 0.1)' : 'rgba(91, 107, 129, 0.1)',
    titleText: surface.text,
    labelText: surface.text,
    tooltipRadius: 10,
    legendText: surface.textSecondary,
  };
};

export const getRiskTone = (level: string) => {
  if (level === 'high' || level === 'medium' || level === 'low') {
    return riskToneTokens[level];
  }

  return riskToneTokens.low;
};

export const getTemperatureTone = (value: number, warningThreshold = 35, dangerThreshold = 40) => {
  if (value > dangerThreshold) {
    return riskToneTokens.high;
  }

  if (value > warningThreshold) {
    return riskToneTokens.medium;
  }

  return riskToneTokens.low;
};

const sharedTokenConfig = {
  colorPrimary: brandTokens.primary,
  colorInfo: brandTokens.primary,
  colorSuccess: semanticTokens.success,
  colorWarning: semanticTokens.warning,
  colorError: semanticTokens.danger,
  colorPrimaryBg: hexToRgba(brandTokens.primary, 0.12),
  colorPrimaryBgHover: hexToRgba(brandTokens.primary, 0.18),
  colorPrimaryBorder: hexToRgba(brandTokens.primary, 0.22),
  colorBorderSecondary: hexToRgba(surfaceTokens.light.textSecondary, 0.1),
  colorFillAlter: surfaceTokens.light.soft,
  borderRadius: Number.parseInt(radiusTokens.lg),
  borderRadiusSM: Number.parseInt(radiusTokens.md),
  borderRadiusLG: Number.parseInt(radiusTokens.xl),
  fontFamily: typographyTokens.fontBody,
  fontSize: 14,
  fontSizeSM: 13,
  fontSizeLG: 16,
  fontSizeHeading1: Number.parseInt(typographyTokens.displaySm),
  fontSizeHeading2: Number.parseInt(typographyTokens.headingLg),
  fontSizeHeading3: Number.parseInt(typographyTokens.headingMd),
  fontSizeHeading4: Number.parseInt(typographyTokens.headingSm),
  controlHeight: 36,
  controlHeightLG: 44,
  controlHeightSM: 30,
  boxShadowSecondary: shadowTokens.light.lg,
  boxShadowTertiary: shadowTokens.light.md,
  motionDurationFast: '0.15s',
  motionDurationMid: '0.25s',
  motionDurationSlow: '0.4s',
} as const;

export const lightTheme: ThemeConfig = {
  token: {
    ...sharedTokenConfig,
    colorBgContainer: lightSurfaces.container,
    colorBgElevated: lightSurfaces.container,
    colorBgLayout: lightSurfaces.layout,
    colorBgSpotlight: '#0f1b2d',
    colorText: lightSurfaces.text,
    colorTextSecondary: lightSurfaces.textSecondary,
    colorBorder: lightSurfaces.border,
    colorBorderSecondary: hexToRgba(lightSurfaces.textSecondary, 0.12),
    colorFillAlter: lightSurfaces.soft,
  },
  components: {
    Layout: {
      bodyBg: lightSurfaces.layout,
      siderBg: lightSurfaces.rail,
      headerBg: lightSurfaces.chrome,
    },
    Card: {
      colorBorderSecondary: lightSurfaces.border,
      colorBgContainer: lightSurfaces.container,
      headerBg: 'transparent',
      paddingLG: 20,
    },
    Table: {
      headerBg: lightSurfaces.table,
      headerColor: lightSurfaces.textSecondary,
      rowHoverBg: lightSurfaces.rowHover,
      bodySortBg: lightSurfaces.table,
      borderColor: hexToRgba(lightSurfaces.textSecondary, 0.12),
      headerBorderRadius: Number.parseInt(radiusTokens.lg),
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: lightSurfaces.textSecondary,
      itemHoverColor: lightSurfaces.text,
      itemHoverBg: hexToRgba(brandTokens.primary, 0.05),
      itemActiveBg: hexToRgba(brandTokens.primary, 0.08),
      itemSelectedBg: hexToRgba(brandTokens.primary, 0.1),
      itemSelectedColor: brandTokens.primaryTextLight,
      itemBorderRadius: Number.parseInt(radiusTokens.md),
      subMenuItemBorderRadius: Number.parseInt(radiusTokens.md),
    },
    Select: {
      selectorBg: lightSurfaces.soft,
      colorBorder: lightSurfaces.border,
      optionSelectedBg: hexToRgba(brandTokens.primary, 0.08),
      optionActiveBg: hexToRgba(brandTokens.primary, 0.05),
      optionSelectedColor: lightSurfaces.text,
    },
    Input: {
      colorBgContainer: lightSurfaces.soft,
      colorBorder: lightSurfaces.border,
      activeBorderColor: brandTokens.primary,
      hoverBorderColor: hexToRgba(brandTokens.primary, 0.36),
      activeShadow: `0 0 0 2px ${hexToRgba(brandTokens.primary, 0.12)}`,
    },
    InputNumber: {
      colorBgContainer: lightSurfaces.soft,
      colorBorder: lightSurfaces.border,
      activeBorderColor: brandTokens.primary,
      hoverBorderColor: hexToRgba(brandTokens.primary, 0.36),
      activeShadow: `0 0 0 2px ${hexToRgba(brandTokens.primary, 0.12)}`,
    },
    Button: {
      defaultBg: lightSurfaces.container,
      defaultBorderColor: lightSurfaces.border,
      defaultColor: lightSurfaces.text,
      primaryShadow: 'none',
      defaultShadow: 'none',
      defaultHoverBg: lightSurfaces.soft,
      defaultHoverBorderColor: hexToRgba(brandTokens.primary, 0.36),
      defaultHoverColor: lightSurfaces.text,
      defaultActiveBg: lightSurfaces.table,
      defaultActiveBorderColor: hexToRgba(brandTokens.primary, 0.4),
      defaultActiveColor: lightSurfaces.text,
      paddingBlock: 8,
      paddingInline: 16,
    },
    Tabs: {
      itemColor: lightSurfaces.textSecondary,
      itemSelectedColor: lightSurfaces.text,
      itemHoverColor: lightSurfaces.text,
      inkBarColor: brandTokens.primary,
      cardBg: lightSurfaces.container,
      cardHeight: 36,
      cardPadding: '6px 12px',
    },
    Tag: {
      borderRadiusSM: Number.parseInt(radiusTokens.full),
      defaultBg: lightSurfaces.soft,
      defaultColor: lightSurfaces.textSecondary,
    },
    Modal: {
      contentBg: lightSurfaces.container,
      headerBg: lightSurfaces.container,
      titleColor: lightSurfaces.text,
      colorIcon: lightSurfaces.textSecondary,
      colorIconHover: lightSurfaces.text,
      boxShadow: shadowTokens.light.xl,
      paddingLG: 24,
    },
    Tooltip: {
      colorBgSpotlight: '#0f1b2d',
      colorTextLightSolid: '#f8fbff',
    },
    Message: {
      contentBg: lightSurfaces.container,
    },
    Notification: {
      boxShadow: shadowTokens.light.lg,
    },
    Popover: {
      boxShadow: shadowTokens.light.xl,
    },
    Dropdown: {
      boxShadow: shadowTokens.light.lg,
    },
    DatePicker: {
      boxShadow: shadowTokens.light.lg,
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    ...sharedTokenConfig,
    colorBgContainer: darkSurfaces.container,
    colorBgElevated: darkSurfaces.container,
    colorBgLayout: darkSurfaces.layout,
    colorBgSpotlight: '#f8fbff',
    colorText: darkSurfaces.text,
    colorTextSecondary: darkSurfaces.textSecondary,
    colorBorder: darkSurfaces.border,
    colorBorderSecondary: hexToRgba(darkSurfaces.textSecondary, 0.14),
    colorFillAlter: darkSurfaces.soft,
    boxShadowSecondary: shadowTokens.dark.lg,
    boxShadowTertiary: shadowTokens.dark.md,
  },
  components: {
    Layout: {
      bodyBg: darkSurfaces.layout,
      siderBg: darkSurfaces.rail,
      headerBg: darkSurfaces.chrome,
    },
    Card: {
      colorBorderSecondary: darkSurfaces.border,
      colorBgContainer: darkSurfaces.container,
      headerBg: 'transparent',
      paddingLG: 20,
    },
    Table: {
      headerBg: darkSurfaces.table,
      headerColor: darkSurfaces.textSecondary,
      rowHoverBg: darkSurfaces.rowHover,
      bodySortBg: darkSurfaces.table,
      borderColor: hexToRgba(darkSurfaces.textSecondary, 0.14),
      headerBorderRadius: Number.parseInt(radiusTokens.lg),
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: darkSurfaces.textSecondary,
      itemHoverColor: darkSurfaces.text,
      itemHoverBg: hexToRgba(brandTokens.primaryTint, 0.08),
      itemActiveBg: hexToRgba(brandTokens.primaryTint, 0.1),
      itemSelectedBg: hexToRgba(brandTokens.primaryTint, 0.14),
      itemSelectedColor: brandTokens.primaryTextDark,
      itemBorderRadius: Number.parseInt(radiusTokens.md),
      subMenuItemBorderRadius: Number.parseInt(radiusTokens.md),
      darkItemBg: 'transparent',
    },
    Select: {
      selectorBg: darkSurfaces.soft,
      colorBorder: darkSurfaces.border,
      optionSelectedBg: hexToRgba(brandTokens.primaryTint, 0.08),
      optionActiveBg: hexToRgba(brandTokens.primaryTint, 0.05),
      optionSelectedColor: darkSurfaces.text,
    },
    Input: {
      colorBgContainer: darkSurfaces.soft,
      colorBorder: darkSurfaces.border,
      activeBorderColor: brandTokens.primaryTint,
      hoverBorderColor: hexToRgba(brandTokens.primaryTint, 0.4),
      activeShadow: `0 0 0 2px ${hexToRgba(brandTokens.primaryTint, 0.12)}`,
    },
    InputNumber: {
      colorBgContainer: darkSurfaces.soft,
      colorBorder: darkSurfaces.border,
      activeBorderColor: brandTokens.primaryTint,
      hoverBorderColor: hexToRgba(brandTokens.primaryTint, 0.4),
      activeShadow: `0 0 0 2px ${hexToRgba(brandTokens.primaryTint, 0.12)}`,
    },
    Button: {
      defaultBg: darkSurfaces.container,
      defaultBorderColor: darkSurfaces.border,
      defaultColor: darkSurfaces.text,
      primaryShadow: 'none',
      defaultShadow: 'none',
      defaultHoverBg: darkSurfaces.soft,
      defaultHoverBorderColor: hexToRgba(brandTokens.primaryTint, 0.36),
      defaultHoverColor: darkSurfaces.text,
      defaultActiveBg: darkSurfaces.table,
      defaultActiveBorderColor: hexToRgba(brandTokens.primaryTint, 0.4),
      defaultActiveColor: darkSurfaces.text,
      paddingBlock: 8,
      paddingInline: 16,
    },
    Tabs: {
      itemColor: darkSurfaces.textSecondary,
      itemSelectedColor: darkSurfaces.text,
      itemHoverColor: darkSurfaces.text,
      inkBarColor: brandTokens.primaryTint,
      cardBg: darkSurfaces.container,
      cardHeight: 36,
      cardPadding: '6px 12px',
    },
    Tag: {
      borderRadiusSM: Number.parseInt(radiusTokens.full),
      defaultBg: darkSurfaces.soft,
      defaultColor: darkSurfaces.textSecondary,
    },
    Modal: {
      contentBg: darkSurfaces.container,
      headerBg: darkSurfaces.container,
      titleColor: darkSurfaces.text,
      colorIcon: darkSurfaces.textSecondary,
      colorIconHover: darkSurfaces.text,
      boxShadow: shadowTokens.dark.xl,
      paddingLG: 24,
    },
    Tooltip: {
      colorBgSpotlight: '#142233',
      colorTextLightSolid: '#f6faff',
    },
    Message: {
      contentBg: darkSurfaces.container,
    },
    Notification: {
      boxShadow: shadowTokens.dark.lg,
    },
    Popover: {
      boxShadow: shadowTokens.dark.xl,
    },
    Dropdown: {
      boxShadow: shadowTokens.dark.lg,
    },
    DatePicker: {
      boxShadow: shadowTokens.dark.lg,
    },
  },
};
