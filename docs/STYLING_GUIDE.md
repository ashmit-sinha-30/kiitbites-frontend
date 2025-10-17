# KAMPYN Frontend - Styling Guide

*Project under **EXSOLVIA** - Excellence in Software Solutions*

## Design System

### Color Palette

#### Primary Colors
```scss
// styles/variables.scss
:root {
  // Primary Brand Colors
  --color-primary: #2563eb;
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1d4ed8;
  
  // Secondary Colors
  --color-secondary: #64748b;
  --color-secondary-light: #94a3b8;
  --color-secondary-dark: #475569;
  
  // Accent Colors
  --color-accent: #f59e0b;
  --color-accent-light: #fbbf24;
  --color-accent-dark: #d97706;
  
  // Status Colors
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
}
```

#### Neutral Colors
```scss
:root {
  // Background Colors
  --color-background: #ffffff;
  --color-background-secondary: #f8fafc;
  --color-background-tertiary: #f1f5f9;
  
  // Text Colors
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;
  --color-text-inverse: #ffffff;
  
  // Border Colors
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-border-dark: #cbd5e1;
  
  // Surface Colors
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);
}
```

### Typography

#### Font Families
```scss
:root {
  // Primary Font
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  // Secondary Font
  --font-secondary: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  // Monospace Font
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

#### Font Sizes
```scss
:root {
  // Font Sizes
  --font-size-xs: 0.75rem;    // 12px
  --font-size-sm: 0.875rem;   // 14px
  --font-size-base: 1rem;     // 16px
  --font-size-lg: 1.125rem;   // 18px
  --font-size-xl: 1.25rem;    // 20px
  --font-size-2xl: 1.5rem;    // 24px
  --font-size-3xl: 1.875rem;  // 30px
  --font-size-4xl: 2.25rem;   // 36px
  --font-size-5xl: 3rem;      // 48px
  
  // Font Weights
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  // Line Heights
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### Spacing System

#### Spacing Scale
```scss
:root {
  // Spacing Scale (based on 4px grid)
  --space-1: 0.25rem;   // 4px
  --space-2: 0.5rem;    // 8px
  --space-3: 0.75rem;   // 12px
  --space-4: 1rem;      // 16px
  --space-5: 1.25rem;   // 20px
  --space-6: 1.5rem;    // 24px
  --space-8: 2rem;      // 32px
  --space-10: 2.5rem;   // 40px
  --space-12: 3rem;     // 48px
  --space-16: 4rem;     // 64px
  --space-20: 5rem;     // 80px
  --space-24: 6rem;     // 96px
  --space-32: 8rem;     // 128px
}
```

### Border Radius

#### Border Radius Scale
```scss
:root {
  // Border Radius
  --radius-none: 0;
  --radius-sm: 0.125rem;   // 2px
  --radius-base: 0.25rem;  // 4px
  --radius-md: 0.375rem;   // 6px
  --radius-lg: 0.5rem;     // 8px
  --radius-xl: 0.75rem;    // 12px
  --radius-2xl: 1rem;      // 16px
  --radius-3xl: 1.5rem;    // 24px
  --radius-full: 9999px;
}
```

### Shadows

#### Shadow System
```scss
:root {
  // Box Shadows
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

## Component Styling

### Button Styles
```scss
// components/ui/Button.module.scss
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  // Primary variant
  &.primary {
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: var(--shadow-sm);
    }
  }
  
  // Secondary variant
  &.secondary {
    background-color: var(--color-secondary);
    color: var(--color-text-inverse);
    
    &:hover:not(:disabled) {
      background-color: var(--color-secondary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }
  
  // Outline variant
  &.outline {
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary);
      color: var(--color-text-inverse);
    }
  }
  
  // Ghost variant
  &.ghost {
    background-color: transparent;
    color: var(--color-text-primary);
    
    &:hover:not(:disabled) {
      background-color: var(--color-background-secondary);
    }
  }
  
  // Size variants
  &.sm {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
  }
  
  &.lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--font-size-lg);
  }
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Input Styles
```scss
// components/ui/Input.module.scss
.inputContainer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-family: var(--font-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.inputWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  transition: all 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:disabled {
    background-color: var(--color-background-secondary);
    color: var(--color-text-tertiary);
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
  
  &.error {
    border-color: var(--color-error);
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.startIcon,
.endIcon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.startIcon {
  left: var(--space-3);
}

.endIcon {
  right: var(--space-3);
}

.errorText {
  font-family: var(--font-primary);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.helperText {
  font-family: var(--font-primary);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
```

### Card Styles
```scss
// components/ui/Card.module.scss
.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  
  &.hoverable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-border-dark);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: var(--shadow-md);
    }
  }
}

.header {
  padding: var(--space-6) var(--space-6) 0;
  
  .title {
    font-family: var(--font-primary);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }
}

.content {
  padding: var(--space-6);
}
```

## Layout Styles

### Container Styles
```scss
// styles/containers.scss
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  
  @media (min-width: 640px) {
    padding: 0 var(--space-6);
  }
  
  @media (min-width: 1024px) {
    padding: 0 var(--space-8);
  }
}

.container-sm {
  max-width: 640px;
}

.container-md {
  max-width: 768px;
}

.container-lg {
  max-width: 1024px;
}

.container-xl {
  max-width: 1280px;
}
```

### Grid System
```scss
// styles/grid.scss
.grid {
  display: grid;
  gap: var(--space-6);
  
  &.cols-1 { grid-template-columns: repeat(1, 1fr); }
  &.cols-2 { grid-template-columns: repeat(2, 1fr); }
  &.cols-3 { grid-template-columns: repeat(3, 1fr); }
  &.cols-4 { grid-template-columns: repeat(4, 1fr); }
  
  @media (max-width: 768px) {
    &.cols-2,
    &.cols-3,
    &.cols-4 {
      grid-template-columns: 1fr;
    }
  }
}

.flex {
  display: flex;
  gap: var(--space-4);
  
  &.col {
    flex-direction: column;
  }
  
  &.row {
    flex-direction: row;
  }
  
  &.center {
    align-items: center;
    justify-content: center;
  }
  
  &.between {
    justify-content: space-between;
  }
  
  &.around {
    justify-content: space-around;
  }
}
```

## Responsive Design

### Breakpoints
```scss
// styles/breakpoints.scss
$breakpoints: (
  xs: 480px,
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1536px
);

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}
```

### Responsive Utilities
```scss
// styles/responsive.scss
.hidden {
  display: none;
}

.visible {
  display: block;
}

@include respond-to(sm) {
  .sm-hidden { display: none; }
  .sm-visible { display: block; }
}

@include respond-to(md) {
  .md-hidden { display: none; }
  .md-visible { display: block; }
}

@include respond-to(lg) {
  .lg-hidden { display: none; }
  .lg-visible { display: block; }
}
```

## Animation & Transitions

### Animation Utilities
```scss
// styles/animations.scss
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

.slide-down {
  animation: slideDown 0.3s ease-out;
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Transition Utilities
```scss
// styles/transitions.scss
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}

.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}
```

## Best Practices

### SCSS Organization
```scss
// Component SCSS file structure
.component {
  // 1. Component container styles
  display: flex;
  padding: var(--space-4);
  
  // 2. Element styles
  .element {
    margin: var(--space-2);
  }
  
  // 3. Modifier styles
  &.modifier {
    background-color: var(--color-primary);
  }
  
  // 4. State styles
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
  }
  
  // 5. Responsive styles
  @include respond-to(md) {
    padding: var(--space-6);
  }
}
```

### CSS Custom Properties Usage
```scss
// Use CSS custom properties for consistency
.component {
  color: var(--color-text-primary);
  background-color: var(--color-background);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

### Accessibility Considerations
```scss
// Focus styles for accessibility
.interactive-element {
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  &:focus:not(:focus-visible) {
    outline: none;
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .component {
    border: 2px solid currentColor;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

**© 2025 EXSOLVIA. All rights reserved.**