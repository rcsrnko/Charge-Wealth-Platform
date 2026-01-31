# Charge Wealth Color System Guide

## Overview

This guide documents the Charge Wealth color system. **All colors should be referenced through CSS variables** defined in `colors.css`. Never use hardcoded hex values in component styles.

---

## Quick Reference: Which Token to Use

| Situation | Use This Token |
|-----------|----------------|
| Page background | `--surface-primary` |
| Card/modal background | `--surface-elevated` |
| Sidebar background | `--sidebar-bg` |
| Primary text | `--text-primary` |
| Secondary/description text | `--text-secondary` |
| Text on honey buttons | `--text-on-honey` ⚠️ |
| Primary CTA button | `--accent-primary` |
| Blue link/action | `--accent-blue-text` |
| Success indicator | `--status-success` |
| Error message | `--status-error-text` |
| Standard border | `--border-default` |

---

## Core Principles

### 1. Always Use Semantic Tokens
```css
/* ❌ WRONG - Hardcoded color */
.button {
  background: #F6DBA6;
  color: #1F2937;
}

/* ✅ CORRECT - Semantic token */
.button {
  background: var(--accent-primary);
  color: var(--accent-primary-text);
}
```

### 2. Respect Text-on-Background Pairings
Every text color has specific backgrounds it works with:

| Text Token | Safe Backgrounds | Contrast Ratio |
|------------|------------------|----------------|
| `--text-primary` | `--surface-primary`, `--surface-elevated`, `--surface-secondary` | 9.5:1+ |
| `--text-secondary` | `--surface-primary`, `--surface-elevated` | 5.7:1 |
| `--text-on-honey` | `--accent-primary`, `--accent-primary-hover` | 7.2:1 |
| `--text-on-success` | `--status-success` | 4.5:1+ |
| `--text-on-error` | `--status-error` | 4.5:1+ |

### 3. Use Status Colors Consistently
```css
/* Success states */
.success { color: var(--status-success-text); background: var(--status-success-bg); }

/* Error states */
.error { color: var(--status-error-text); background: var(--status-error-bg); }

/* Warning states */
.warning { color: var(--status-warning-text); background: var(--status-warning-bg); }

/* Info states */
.info { color: var(--status-info-text); background: var(--status-info-bg); }
```

---

## Semantic Token Categories

### Surface Colors (Backgrounds)
```css
--surface-primary      /* Main page background: #F9F6F0 */
--surface-secondary    /* Sidebar, secondary areas: #F5F2ED */
--surface-tertiary     /* Nested elements: #EFEBE5 */
--surface-elevated     /* Cards, modals: #FFFDFB */
--surface-overlay      /* Modal backdrop: rgba(0,0,0,0.4) */
```

**Usage:**
```css
.page { background: var(--surface-primary); }
.card { background: var(--surface-elevated); }
.sidebar { background: var(--surface-secondary); }
.modal-backdrop { background: var(--surface-overlay); }
```

### Text Colors
```css
--text-primary      /* Headings, body: #1F2937 */
--text-secondary    /* Descriptions: #6B7280 */
--text-muted        /* Hints, timestamps: #9CA3AF */
--text-placeholder  /* Input placeholders: #9CA3AF */
--text-inverse      /* Text on dark: #FFFDFB */
```

**Text on Colored Backgrounds:**
```css
--text-on-honey     /* Text on honey buttons: #4A3F2F */
--text-on-success   /* Text on success bg: #FFFFFF */
--text-on-error     /* Text on error bg: #FFFFFF */
--text-on-dark      /* Text on dark surfaces: #FFFDFB */
```

### Accent Colors
```css
/* Primary Accent (Honey/Gold) */
--accent-primary         /* CTAs, primary buttons: #F6DBA6 */
--accent-primary-hover   /* Hover state: #E8C88A */
--accent-primary-text    /* Text on accent: #4A3F2F */
--accent-muted           /* Subtle accent bg: rgba(246,219,166,0.2) */

/* Blue Accent */
--accent-blue            /* Soft blue bg: #DBEAFE */
--accent-blue-hover      /* Blue hover: #BFDBFE */
--accent-blue-text       /* Blue text/links: #1D4ED8 */
--accent-blue-solid      /* Solid blue button: #3B82F6 */
```

### Status Colors
```css
/* Success */
--status-success         /* Icon/indicator: #15803D */
--status-success-bg      /* Background: #F0FDF4 */
--status-success-text    /* Text: #166534 */

/* Error */
--status-error           /* Icon/indicator: #B91C1C */
--status-error-bg        /* Background: #FEF2F2 */
--status-error-text      /* Text: #991B1B */

/* Warning */
--status-warning         /* Icon/indicator: #B45309 */
--status-warning-bg      /* Background: #FFFBEB */
--status-warning-text    /* Text: #92400E */

/* Info */
--status-info            /* Icon/indicator: #2563EB */
--status-info-bg         /* Background: #EFF6FF */
--status-info-text       /* Text: #1E40AF */
```

### Border Colors
```css
--border-subtle     /* Very light: rgba(0,0,0,0.05) */
--border-default    /* Standard: rgba(0,0,0,0.08) */
--border-strong     /* Emphasized: rgba(0,0,0,0.12) */
--border-focus      /* Focus rings: #F6DBA6 */
```

---

## Do's and Don'ts

### ✅ DO

1. **Use semantic tokens for colors**
   ```css
   color: var(--text-primary);
   background: var(--surface-elevated);
   ```

2. **Use `--text-on-honey` for text on honey backgrounds**
   ```css
   .cta-button {
     background: var(--accent-primary);
     color: var(--text-on-honey);
   }
   ```

3. **Use status token families together**
   ```css
   .error-banner {
     background: var(--status-error-bg);
     color: var(--status-error-text);
     border-color: var(--status-error);
   }
   ```

4. **Provide fallbacks for legacy CSS**
   ```css
   color: var(--text-secondary, #6B7280);
   ```

5. **Test in both light and dark modes**

### ❌ DON'T

1. **Use hardcoded hex colors**
   ```css
   /* BAD */
   color: #F6DBA6;
   background: #1F2937;
   ```

2. **Use light text on light backgrounds**
   ```css
   /* BAD - pale gold on cream has ~1.5:1 contrast */
   .card { color: #F6DBA6; background: #FFFDFB; }
   ```

3. **Use `--text-primary` on honey backgrounds**
   ```css
   /* BAD - gray on yellow is hard to read */
   .button { background: var(--accent-primary); color: var(--text-primary); }
   ```

4. **Mix light-mode and dark-mode tokens**
   ```css
   /* BAD - tokens handle mode switching automatically */
   .dark .card { color: #F5F5F5; }
   ```

5. **Create one-off color values**
   ```css
   /* BAD - use existing tokens */
   --custom-gold: #D4B76D;
   ```

---

## Common Patterns

### Primary Button
```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-on-honey);
  border: none;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}
```

### Card Component
```css
.card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--card-shadow);
}

.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--card-shadow-hover);
}
```

### Form Input
```css
.input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
}

.input::placeholder {
  color: var(--text-placeholder);
}

.input:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--accent-muted);
}
```

### Status Badge
```css
.badge-success {
  background: var(--badge-success-bg);
  color: var(--badge-success-text);
}

.badge-error {
  background: var(--badge-error-bg);
  color: var(--badge-error-text);
}
```

### Positive/Negative Values (Finance)
```css
/* Money gained */
.positive { color: var(--status-success-text); }

/* Money lost */
.negative { color: var(--status-error-text); }
```

### Link Styling
```css
.link {
  color: var(--accent-blue-text);
}

.link:hover {
  color: var(--accent-blue-solid);
}
```

---

## Contrast Pairing Reference

### Safe Text on Light Surfaces
| Background | Safe Text Colors |
|------------|------------------|
| `--surface-primary` (#F9F6F0) | `--text-primary`, `--text-secondary` |
| `--surface-elevated` (#FFFDFB) | `--text-primary`, `--text-secondary` |
| `--surface-secondary` (#F5F2ED) | `--text-primary`, `--text-secondary` |

### Safe Text on Accent Surfaces
| Background | Safe Text Color |
|------------|-----------------|
| `--accent-primary` (#F6DBA6) | `--text-on-honey` (#4A3F2F) |
| `--accent-primary-hover` (#E8C88A) | `--text-on-honey` (#4A3F2F) |
| `--status-success` (#15803D) | `--text-on-success` (white) |
| `--status-error` (#B91C1C) | `--text-on-error` (white) |
| `--accent-blue-solid` (#3B82F6) | white |

### NEVER Use These Combinations
| Combination | Problem |
|-------------|---------|
| Honey text on cream | 1.5:1 ratio (needs 4.5:1) |
| Light gray on white | Insufficient contrast |
| `--text-secondary` on `--accent-primary` | Wrong pairing |

---

## Dark Mode

The color system automatically adjusts for dark mode via `[data-theme="dark"]` or `.dark` class. 

**You don't need to write separate dark mode styles.** The semantic tokens automatically switch values.

```css
/* This single rule works in both modes */
.card {
  background: var(--surface-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
/* Light mode: cream bg, dark text */
/* Dark mode: dark surface, light text */
```

### Dark Mode Values
| Token | Light | Dark |
|-------|-------|------|
| `--surface-primary` | #F9F6F0 | #121212 |
| `--surface-elevated` | #FFFDFB | #1E1E1E |
| `--text-primary` | #1F2937 | #F5F5F5 |
| `--text-secondary` | #6B7280 | #A3A3A3 |
| `--status-success` | #15803D | #22C55E |
| `--status-error` | #B91C1C | #F87171 |

---

## Migration Checklist

When updating a component:

1. [ ] Replace all `#XXXXXX` hex values with semantic tokens
2. [ ] Replace old variable names (see Legacy Mappings below)
3. [ ] Verify text-on-background contrast pairings
4. [ ] Test in both light and dark mode
5. [ ] Remove any duplicate color definitions

### Legacy Variable Mappings

| Old Variable | Use Instead |
|--------------|-------------|
| `--gold-sand`, `--gold`, `--soft-gold` | `--accent-primary` |
| `--gold-muted` | `--accent-primary-hover` |
| `--midnight-blue`, `--deep-navy` | `--surface-primary/secondary` |
| `--off-white`, `--porcelain` | `--text-primary` |
| `--muted-gray` | `--text-secondary` |
| `--card-bg` | `--surface-elevated` |
| `--charcoal` | `--surface-tertiary` |
| `#D4B76D`, `#D4B77A`, `#B8943E` | `--accent-primary` |
| `#ef4444`, `#EF4444`, `#E74C3C` | `--status-error` |
| `#10b981`, `#22c55e`, `#4ADE80` | `--status-success` |
| `#3B82F6`, `#60A5FA` | `--accent-blue-text` or `--accent-blue-solid` |

---

## File Structure

```
client/src/styles/
├── colors.css      # Single source of truth for all colors
├── colors.ts       # TypeScript exports for inline styles
└── COLOR-GUIDE.md  # This documentation

client/src/index.css
└── @import "./styles/colors.css";  # Must be first import
```

---

## Questions?

If you're unsure which token to use, ask:
1. **What surface is this on?** (page, card, modal)
2. **What is the purpose?** (primary action, status, decoration)
3. **Does it need to work in dark mode?**

When in doubt, use the most specific semantic token available.
