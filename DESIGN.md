# Design System

**Philosophy:** "Barely-there UI" with controlled boldness

## Colors

Replace these placeholders with your brand colors:

```css
--bg: #1a1a1a;              /* Dark background */
--bg-elevated: #242424;     /* Elevated surfaces */
--bg-card: #2a2a2a;         /* Card backgrounds */
--text: #ffffff;             /* Primary text */
--text-muted: rgba(255, 255, 255, 0.6);  /* Secondary text */
--accent: #3b82f6;           /* Primary accent — replace with your brand color */
--accent-hover: #60a5fa;     /* Accent hover state */
```

## Typography

Pick a font pair that fits your brand. Examples:

```css
/* Option A: Clean modern */
--font-display: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;

/* Option B: Editorial feel */
--font-display: 'Playfair Display', serif;
--font-body: 'Source Sans 3', system-ui, sans-serif;

/* Option C: Technical */
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'DM Sans', system-ui, sans-serif;
```

**Hierarchy:**
- h1: `clamp(2.5rem, 8vw, 5rem)`, weight 700
- h2: `clamp(1.75rem, 4vw, 2.5rem)`, weight 700
- h3: `1.25rem`, weight 700
- Body: `1rem`, line-height 1.6
- Small/Tags: `0.75rem`, uppercase, letter-spacing 0.08em

## Spacing Scale

```css
--space-xs: 0.5rem;   /* 8px */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 3rem;     /* 48px */
--space-xl: 6rem;     /* 96px */
```

## Animation

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--transition-fast: 0.2s var(--ease-out);
--transition: 0.4s var(--ease-out);
```

## Glass Border Effect

Used on cards to create a subtle, reflective border with brighter corners and darker edges.

```css
.element {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.element::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
  padding: 1px;
  background: conic-gradient(
    from 45deg,
    rgba(255, 255, 255, 0.15) 0deg,
    rgba(255, 255, 255, 0.03) 45deg,
    rgba(255, 255, 255, 0.15) 90deg,
    rgba(255, 255, 255, 0.03) 135deg,
    rgba(255, 255, 255, 0.15) 180deg,
    rgba(255, 255, 255, 0.03) 225deg,
    rgba(255, 255, 255, 0.15) 270deg,
    rgba(255, 255, 255, 0.03) 315deg,
    rgba(255, 255, 255, 0.15) 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

## Blur Effects

**Background blur:** `blur(20px) brightness(0.3)` on fixed background image

**UI blur:** `backdrop-filter: blur(8px)` on floating elements (buttons, icons)

## Card Hover States

```css
.card:hover {
  transform: scale(1.02);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
}
```

## Image Zoom Behavior

**All cards with images must have cursor-following zoom:**

The image zooms toward the cursor position, creating a "looking closer" effect.

```javascript
// Track cursor position and set transform-origin
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  img.style.transformOrigin = `${x}% ${y}%`;
});

// Reset on mouse leave
card.addEventListener('mouseleave', () => {
  img.style.transformOrigin = 'center center';
});
```

```css
.card-img {
  transition: transform 0.4s var(--ease-out), transform-origin 0.8s ease-out;
}

.card:hover .card-img {
  transform: scale(1.05);
}
```

## Gradients

**Card overlay (bottom-up text protection):**
```css
background: linear-gradient(
  to top,
  rgba(0, 0, 0, 0.95) 0%,
  rgba(0, 0, 0, 0.85) 25%,
  rgba(0, 0, 0, 0.4) 50%,
  transparent 75%
);
```

**Divider lines:**
```css
background: linear-gradient(
  90deg,
  transparent,
  rgba(255, 255, 255, 0.15),
  transparent
);
```

## Border Radius

- Cards: `16px`
- Buttons/pills: `100px` (fully rounded)
- Small elements: `4px` or `8px`

## Fullscreen Modal

Used for video players, image lightboxes, and any immersive content overlay.

**Principles:**
- Fullscreen viewport coverage (`100vw x 100vh`)
- Content centered both horizontally and vertically
- Black background with blur that fades in
- Close button in top-right, above the content
- Closes on: backdrop click, Escape key, or close button
- Native `<dialog>` element for accessibility (focus trap, keyboard nav)

**Backdrop animation:**
```css
dialog::backdrop {
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  animation: backdrop-fade-in 0.4s var(--ease-out) forwards;
}

@keyframes backdrop-fade-in {
  to {
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
  }
}
```
