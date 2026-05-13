import {
  brandTokens,
  semanticTokens,
  energyTokens,
  surfaceTokens,
  typographyTokens,
  spacingTokens,
  radiusTokens,
  shadowTokens,
  transitionTokens,
} from './src/styles/designTokens.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: brandTokens.primary,
          dark: brandTokens.primaryHover,
          light: brandTokens.primaryTint,
          hover: brandTokens.primaryHover,
          shadow: hexToRgba(brandTokens.primary, 0.22),
          foreground: brandTokens.primaryTextLight,
        },
        success: semanticTokens.success,
        warning: semanticTokens.warning,
        danger: semanticTokens.danger,
        risk: { high: semanticTokens.danger, medium: semanticTokens.warning, low: semanticTokens.success },
        electric: {
          DEFAULT: energyTokens.electric,
          hover: energyTokens.electricHover,
          soft: energyTokens.electricSoft,
        },
        charge: {
          DEFAULT: energyTokens.charge,
          hover: energyTokens.chargeHover,
          soft: energyTokens.chargeSoft,
        },
        bg: {
          light: surfaceTokens.light.container,
          gray: surfaceTokens.light.layout,
          dark: surfaceTokens.dark.layout,
          panel: surfaceTokens.dark.container,
          soft: surfaceTokens.dark.soft,
          rail: surfaceTokens.dark.rail,
        },
        surface: {
          layout: surfaceTokens.dark.layout,
          container: surfaceTokens.dark.container,
          chrome: surfaceTokens.dark.chrome,
          soft: surfaceTokens.dark.soft,
          light: surfaceTokens.light.container,
          lightSoft: surfaceTokens.light.soft,
          lightRail: surfaceTokens.light.rail,
        },
        text: {
          primary: surfaceTokens.light.text,
          secondary: surfaceTokens.light.textSecondary,
          dark: surfaceTokens.dark.text,
          darkSecondary: surfaceTokens.dark.textSecondary,
          title: '#f5fbff',
        },
      },
      backgroundImage: {
        'header-gradient': `linear-gradient(90deg, ${brandTokens.primaryHover} 0%, ${brandTokens.primary} 52%, ${brandTokens.primaryTint} 100%)`,
      },
      boxShadow: {
        'panel': shadowTokens.light.md,
        'panel-hover': shadowTokens.light.lg,
        'console-glow': shadowTokens.dark.md,
        'console-sm': shadowTokens.light.sm,
        'console-md': shadowTokens.light.md,
        'console-lg': shadowTokens.light.lg,
        'console-xl': shadowTokens.light.xl,
        'console-dark-sm': shadowTokens.dark.sm,
        'console-dark-md': shadowTokens.dark.md,
        'console-dark-lg': shadowTokens.dark.lg,
        'console-dark-xl': shadowTokens.dark.xl,
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        body: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      fontSize: {
        'console-2xs': [typographyTokens.text2Xs, { lineHeight: '0.875rem' }],
        'console-xs': [typographyTokens.textXs, { lineHeight: '1rem' }],
        'console-sm': [typographyTokens.textSm, { lineHeight: '1.25rem' }],
        'console-base': [typographyTokens.textBase, { lineHeight: '1.5rem' }],
        'console-lg': [typographyTokens.textLg, { lineHeight: '1.5rem' }],
        'heading-sm': [typographyTokens.headingSm, { lineHeight: typographyTokens.lineHeightTitle }],
        'heading-md': [typographyTokens.headingMd, { lineHeight: typographyTokens.lineHeightTitle }],
        'heading-lg': [typographyTokens.headingLg, { lineHeight: typographyTokens.lineHeightDisplay }],
        'display-sm': [typographyTokens.displaySm, { lineHeight: typographyTokens.lineHeightDisplay }],
        'display-md': [typographyTokens.displayMd, { lineHeight: typographyTokens.lineHeightDisplay }],
        'display-lg': [typographyTokens.displayLg, { lineHeight: typographyTokens.lineHeightDisplay }],
      },
      spacing: {
        'console-0': spacingTokens[0],
        'console-1': spacingTokens[1],
        'console-2': spacingTokens[2],
        'console-3': spacingTokens[3],
        'console-4': spacingTokens[4],
        'console-5': spacingTokens[5],
        'console-6': spacingTokens[6],
        'console-8': spacingTokens[8],
        'console-10': spacingTokens[10],
        'console-12': spacingTokens[12],
        'console-16': spacingTokens[16],
        'console-20': spacingTokens[20],
        'console-24': spacingTokens[24],
      },
      borderRadius: {
        'console-sm': radiusTokens.sm,
        'console-md': radiusTokens.md,
        'console-lg': radiusTokens.lg,
        'console-xl': radiusTokens.xl,
        'console-2xl': radiusTokens['2xl'],
        'console-full': radiusTokens.full,
      },
      transitionDuration: {
        'console-fast': '150ms',
        'console-normal': '250ms',
        'console-slow': '400ms',
      },
      transitionTimingFunction: {
        'console': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};

/** @param {string} hex @param {number} alpha */
function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
