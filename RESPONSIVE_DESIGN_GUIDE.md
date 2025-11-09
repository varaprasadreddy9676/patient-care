# MedicsCare Responsive Design & Notch Handling Guide

This guide provides best practices for ensuring your components work seamlessly across all device sizes - from small Android phones (360px) to large iPhones with notches and Dynamic Island.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Device Support](#device-support)
3. [Safe Area Handling](#safe-area-handling)
4. [Responsive Breakpoints](#responsive-breakpoints)
5. [Common Patterns](#common-patterns)
6. [Landscape Mode](#landscape-mode)
7. [Testing Checklist](#testing-checklist)

---

## Quick Start

### Most Important Rules:
1. **Always use `var(--app-height)` instead of `100vh`** - This ensures iOS notch compatibility
2. **Use mixins for safe-area** - Don't hardcode `env()` values
3. **Test in landscape mode** - Many users rotate their devices
4. **Use `clamp()` for responsive sizing** - Automatic scaling across all screens

### Minimal Setup for a New Page:

```scss
// Use the page container utility
.page-container {
  @include page-full-height;
  display: flex;
  flex-direction: column;
}

.page-header {
  @include fixed-header-safe(); // iOS safe + fixed positioning

  @media (orientation: landscape) {
    @include fixed-header-landscape-safe(); // Add landscape support
  }
}

.page-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS

  // Add safe-area on iOS
  .ios & {
    @include safe-area-top(16px);
    @include safe-area-bottom(16px);
  }
}

.page-footer {
  @include fixed-footer-safe(); // iOS safe + fixed positioning

  @media (orientation: landscape) {
    @include fixed-footer-landscape-safe(); // Add landscape support
  }
}
```

---

## Device Support

### Target Devices:

| Device | Width | Height | Notable Features |
|--------|-------|--------|------------------|
| Galaxy S5 (Android) | 360px | 640px | Very small screens |
| iPhone SE (1st/2nd gen) | 375px | 667px | Standard notch |
| iPhone 11/12/13 | 390px | 844px | Standard notch |
| iPhone 12/13/14 Pro | 390px | 932px | Standard notch |
| iPhone 14 Pro Max | 430px | 932px | Larger screen + notch |
| iPhone 15 | 390px | 844px | Standard notch |
| **iPhone 15 Pro** | **393px** | **852px** | **Dynamic Island** |
| iPad (7th gen) | 810px | 1080px | Landscape friendly |
| iPad Pro 11" | 834px | 1194px | Large landscape |
| iPad Pro 12.9" | 1024px | 1366px | Extra large |

### Notch/Safe Area Considerations:

**Portrait Mode:**
- iPhone: ~44px top notch + 34px bottom home indicator
- Standard Android: 0px notch + 0px bottom

**Landscape Mode (Important!):**
- iPhone with notch: 32px left/right safe-area inset
- Most Android: 0px left/right
- iPad with notch: 0px left/right (full width utilization)

---

## Safe Area Handling

### Understanding Safe Area Insets

iOS provides CSS environment variables for notch/home indicator areas:

```css
env(safe-area-inset-top)     /* Notch/Dynamic Island */
env(safe-area-inset-bottom)  /* Home Indicator */
env(safe-area-inset-left)    /* Side notch in landscape */
env(safe-area-inset-right)   /* Side notch in landscape */
```

### Using the Mixins

#### 1. Fixed Headers
```scss
// Portrait + Landscape notch support
.my-header {
  @include fixed-header-landscape-safe();
  height: 56px;
  background: white;
}
```

#### 2. Fixed Footers (Most Common)
```scss
// Perfect for bottom action buttons, floating footers
.my-footer {
  @include fixed-footer-landscape-safe();
  padding: 16px;
  background: white;
}

// Or with additional spacing
.my-footer {
  @include fixed-footer-landscape-safe();
  padding: 16px;
  padding-bottom: calc(16px + var(--safe-area-bottom)); // Extra padding
}
```

#### 3. Content Areas with Safe Areas
```scss
.page-content {
  .ios & {
    @include safe-area-top(16px);  // Top padding + safe-area
    @include safe-area-bottom(16px);  // Bottom padding + safe-area
  }
}
```

#### 4. Landscape-Specific Handling
```scss
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;

  @media (orientation: landscape) {
    @include safe-area-left(0px); // Account for iPhone notch on left
  }
}
```

#### 5. Full-Screen Overlays
```scss
.full-screen-overlay {
  @include fixed-full-safe(); // All sides covered
}
```

### Utility Classes (in HTML)

Use these in templates for quick safe-area padding without SCSS:

```html
<!-- Top safe area (iOS only) -->
<div class="safe-top">Content below notch</div>

<!-- Bottom safe area (iOS only) -->
<div class="safe-bottom">Content above home indicator</div>

<!-- Horizontal safe areas (landscape notches) -->
<div class="safe-horizontal">Protected from side notches</div>

<!-- All sides (portrait + landscape) -->
<div class="safe-all">Fully protected</div>

<!-- Landscape-specific -->
<div class="safe-landscape-left safe-landscape-right">Protected in landscape only</div>
```

---

## Responsive Breakpoints

### Screen Size Breakpoints

```scss
// Very small phones (360px and below) - Galaxy S5, older Android
@media (max-width: 360px) { }

// Small phones (375px-389px) - iPhone SE, iPhone 11
@media (min-width: 375px) and (max-width: 389px) { }

// Mid-size phones (390px-413px) - iPhone 12/13/14
@media (min-width: 390px) and (max-width: 413px) { }

// Standard phones (414px-539px) - iPhone Plus, Pixel
@media (min-width: 414px) and (max-width: 539px) { }

// Large phones (540px-767px) - Larger phones
@media (min-width: 540px) and (max-width: 767px) { }

// Tablets (768px-1023px) - iPad, smaller tablets
@media (min-width: 768px) and (max-width: 1023px) { }

// Large tablets (1024px+) - iPad Pro
@media (min-width: 1024px) { }
```

### Orientation Breakpoints

```scss
// Portrait orientation (default)
@media (orientation: portrait) { }

// Landscape - small screens (very tight vertical space)
@media (orientation: landscape) and (max-height: 400px) { }

// Landscape - normal screens
@media (orientation: landscape) and (max-height: 500px) { }

// Landscape - larger screens
@media (orientation: landscape) and (min-width: 1024px) { }
```

---

## Common Patterns

### Pattern 1: Standard Page with Header + Content + Footer

```scss
.page {
  display: flex;
  flex-direction: column;
  height: var(--app-height); // iOS-safe height
  min-height: var(--app-height);
}

.page-header {
  @include fixed-header-landscape-safe();
  height: 56px;
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  // Account for header + footer + safe-area
  padding: 16px;
  padding-top: calc(56px + 16px + env(safe-area-inset-top));
  padding-bottom: calc(80px + 16px + env(safe-area-inset-bottom));

  .ios & {
    padding-top: calc(56px + 16px + var(--safe-area-top));
    padding-bottom: calc(80px + 16px + var(--safe-area-bottom));
  }
}

.page-footer {
  @include fixed-footer-landscape-safe();
  height: 80px;
  flex-shrink: 0;
}
```

### Pattern 2: Bottom Action Button (Most Common)

```scss
.action-button {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 100;

  .ios & {
    bottom: calc(16px + var(--safe-area-bottom));
  }

  @media (orientation: landscape) and (max-height: 500px) {
    bottom: 8px;
    left: calc(8px + var(--safe-area-left));
    right: calc(8px + var(--safe-area-right));
  }
}
```

### Pattern 3: Tab Navigation with Safe-Area

```scss
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  min-height: 60px;
  background: white;
  border-top: 1px solid #ccc;

  .ios & {
    min-height: calc(60px + var(--safe-area-bottom));
    padding-bottom: var(--safe-area-bottom);
  }

  @media (orientation: landscape) {
    left: env(safe-area-inset-left);
    right: env(safe-area-inset-right);
  }

  @media (orientation: landscape) and (max-height: 500px) {
    min-height: calc(48px + var(--safe-area-bottom));
  }
}

// Adjust ion-content padding to account for tab bar
ion-content {
  .ios & {
    --padding-bottom: calc(60px + var(--safe-area-bottom));
  }

  @supports not (env(safe-area-inset-bottom)) {
    --padding-bottom: 60px;
  }
}
```

### Pattern 4: Modal with Safe-Area

```scss
.modal-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  height: 100dvh; // iOS dynamic viewport

  .ios & {
    padding-top: var(--safe-area-top);
    padding-bottom: var(--safe-area-bottom);
    padding-left: var(--safe-area-left);
    padding-right: var(--safe-area-right);
  }
}

.modal-header {
  flex-shrink: 0;
  height: 56px;
  padding: 16px;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.modal-footer {
  flex-shrink: 0;
  padding: 16px;

  .ios & {
    padding-bottom: calc(16px + var(--safe-area-bottom));
  }
}
```

---

## Landscape Mode

### Why Landscape Matters
- Users rotate devices naturally
- Horizontal space is limited but precious
- Notches move to the sides (iPhone)
- Reduce vertical spacing to maximize content

### Landscape Optimization Strategies

#### 1. Hide Non-Essential Elements
```scss
@media (orientation: landscape) and (max-height: 500px) {
  .logo {
    display: none; // Hide on small landscape
  }

  .subtitle {
    display: none;
  }
}
```

#### 2. Stack Horizontally
```scss
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);

  @media (orientation: landscape) {
    grid-template-columns: 1fr 1fr; // Side by side
    gap: var(--spacing-2); // Reduce gap
  }
}
```

#### 3. Reduce Heights
```scss
.section {
  min-height: 200px; // Portrait

  @media (orientation: landscape) and (max-height: 500px) {
    min-height: auto; // Let content determine height
  }
}
```

#### 4. Full-Width Input Forms
```scss
.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);

  @media (orientation: landscape) and (max-height: 500px) {
    flex-direction: row;
    align-items: flex-end;
    gap: var(--spacing-2);

    input {
      flex: 1;
    }

    button {
      flex-shrink: 0;
    }
  }
}
```

---

## Testing Checklist

### Before Shipping Your Component:

- [ ] **360px (Portrait)** - Galaxy S5, old Android
  - [ ] All text readable
  - [ ] No horizontal scrolling
  - [ ] Touch targets ≥44px
  - [ ] Spacing doesn't collapse

- [ ] **390px (Portrait)** - iPhone 12/13/14 standard
  - [ ] Notch doesn't overlap content
  - [ ] All elements visible without scrolling excessive amounts
  - [ ] Buttons accessible

- [ ] **6.5" (Portrait)** - iPhone Plus, large phones
  - [ ] Content not stretched
  - [ ] Proportions look good
  - [ ] Scrolling smooth

- [ ] **iPhone with Notch (Portrait)**
  - [ ] No content behind notch
  - [ ] Header properly spaced below notch
  - [ ] Safe-area classes/mixins applied

- [ ] **Landscape Mode (All Devices)**
  - [ ] Notch/safe-area on sides handled
  - [ ] Content doesn't get cut off
  - [ ] Buttons and inputs accessible
  - [ ] No vertical space wasted

- [ ] **iPhone Landscape with Dynamic Island**
  - [ ] Dynamic Island doesn't block content
  - [ ] Side safe-areas applied
  - [ ] Footer not overlapping safe-area

- [ ] **iPad (Landscape)**
  - [ ] Uses full width efficiently
  - [ ] Content not stretched
  - [ ] Balanced layout

### Browser DevTools Testing:

```javascript
// Check safe-area inset values
getComputedStyle(document.documentElement)
  .getPropertyValue('--safe-area-top')

// Quick mobile testing (Chrome DevTools):
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device from dropdown
4. Test all orientations (Cmd+Y / Ctrl+Y)
```

### Real Device Testing (Recommended):

- Borrow/test on: iPhone 12/13/14 with notch, iPhone SE, Android 360px phone
- Test in browser AND as native app (via Capacitor)
- Verify smooth scrolling and no layout jumps

### Common Issues to Watch For:

1. **Content behind notch** - Use `safe-area-inset-top`
2. **Buttons overlap home indicator** - Use `safe-area-inset-bottom`
3. **Landscape notch not handled** - Use `safe-area-inset-left/right`
4. **Mobile browser bars causing issues** - Use `100dvh` or `var(--app-height)`
5. **Text wrapping unexpectedly** - Use `clamp()` for responsive sizing
6. **Horizontal scrollbar appears** - Check `max-width: 100%` on containers

---

## FAQ

### Q: My content is hidden behind the notch. How do I fix it?
A: Apply `@include safe-area-top();` to the container, or add `padding-top: env(safe-area-inset-top)`.

### Q: How do I hide the home indicator area?
A: You don't - it's protected by iOS. Use `@include safe-area-bottom();` to add padding above it.

### Q: Should I use `100vh` or `var(--app-height)`?
A: Always use `var(--app-height)`. It becomes `100dvh` on iOS (dynamic viewport) and `100vh` on Android.

### Q: How do I test landscape mode?
A: Chrome DevTools - press Cmd+Y (Mac) or Ctrl+Y (Windows) to toggle device orientation.

### Q: My footer overlaps content. What's wrong?
A: The page's `ion-content` needs bottom padding. Use:
```scss
ion-content {
  --padding-bottom: calc(80px + env(safe-area-inset-bottom));
}
```

### Q: What's the difference between `fixed-header-safe()` and `fixed-header-landscape-safe()`?
A:
- `fixed-header-safe()` - Top safe-area only (portrait)
- `fixed-header-landscape-safe()` - Top + left/right safe-area (all orientations)

Use `fixed-header-landscape-safe()` by default for full coverage.

---

## Resources

- [MDN: env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/env())
- [Apple: Supporting apps with notches and rounded corners](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)

---

## Contributing

When adding new components:
1. Always test on both portrait and landscape
2. Use mixins instead of hardcoding `env()` values
3. Use `clamp()` for responsive sizing
4. Document any special safe-area handling in code comments
5. Add to this guide if you create a new pattern

