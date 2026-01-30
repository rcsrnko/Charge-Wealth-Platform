/**
 * Charge Wealth Design System - Centralized Color Definitions
 * 
 * This file exports:
 * 1. `colors` - Raw hex color values for reference
 * 2. `cssVars` - CSS custom property references for inline styles
 * 
 * USAGE:
 * - For inline styles, always use cssVars: `background: cssVars.bgPrimary`
 * - Colors automatically adapt to light/dark mode via CSS variables
 */

// ============================================
// RAW BRAND COLORS (for reference only)
// ============================================
export const colors = {
  // Light Mode - Vanilla Bean Theme
  vanillaBean: '#F9F6F0',
  cream: '#FFFDFB',
  warmStone: '#F5F2ED',
  honey: '#F6DBA6',
  honeyHover: '#E8C88A',
  honeyDark: '#4A3F2F',
  softBlue: '#DBEAFE',
  blueHover: '#BFDBFE',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  // Dark Mode
  darkBg: '#121212',
  darkSurface: '#1E1E1E',
  darkElevated: '#252525',
  darkText: '#F5F5F5',
  darkTextSecondary: '#A3A3A3',
  
  // Semantic Colors
  success: '#2E7D32',
  successLight: '#15803D',
  error: '#DC2626',
  errorDark: '#B91C1C',
  warning: '#B45309',
  info: '#1D4ED8',
  
  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ============================================
// CSS VARIABLE REFERENCES (use these in code!)
// ============================================
export const cssVars = {
  // Backgrounds
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-secondary)',
  bgTertiary: 'var(--bg-tertiary)',
  bgElevated: 'var(--bg-elevated)',
  
  // Text
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textLight: 'var(--text-light)',
  textPlaceholder: 'var(--text-placeholder)',
  textOnAccent: 'var(--text-on-honey)',
  
  // Brand Accent (Honey)
  brandAccent: 'var(--brand-accent)',
  brandAccentHover: 'var(--brand-accent-hover)',
  brandAccentLight: 'var(--brand-accent-light)',
  
  // Accent Blue
  accentBlue: 'var(--accent-blue)',
  accentBlueHover: 'var(--accent-blue-hover)',
  
  // Status Colors
  success: 'var(--success)',
  successLight: 'var(--success-light)',
  successText: 'var(--success-text)',
  error: 'var(--error)',
  errorLight: 'var(--error-light)',
  errorText: 'var(--error-text)',
  warning: 'var(--warning)',
  warningLight: 'var(--warning-light)',
  warningText: 'var(--warning-text)',
  info: 'var(--info)',
  infoLight: 'var(--info-light)',
  infoText: 'var(--info-text)',
  
  // Borders
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  subtleBorder: 'var(--subtle-border)',
  
  // Input
  inputBg: 'var(--input-bg)',
  inputBorder: 'var(--input-border)',
  inputBorderFocus: 'var(--input-border-focus)',
  
  // Sidebar
  sidebarBg: 'var(--sidebar-bg)',
  sidebarHover: 'var(--sidebar-hover)',
  sidebarActive: 'var(--sidebar-active)',
  
  // Shadows
  shadow: 'var(--shadow)',
  shadowSm: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
  
  // Overlay
  overlay: 'var(--overlay)',
} as const;

// ============================================
// TYPE EXPORTS
// ============================================
export type ColorKey = keyof typeof colors;
export type CssVarKey = keyof typeof cssVars;
