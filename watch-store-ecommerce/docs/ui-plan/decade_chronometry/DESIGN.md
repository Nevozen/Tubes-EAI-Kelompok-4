---
name: Decade Chronometry
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#6dfe9c'
  on-secondary-container: '#007439'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c1c'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#e4e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  unit: 8px
---

## Brand & Style

The design system is rooted in a **High-Contrast / Modern** aesthetic that balances editorial elegance with functional clarity. It is tailored for a luxury e-commerce experience, specifically targeting a sophisticated audience that values precision and timelessness. 

The visual narrative is "Industrial Minimalist." It utilizes heavy whitespace to allow product photography to breathe, while employing sharp, stark typographic choices to convey a sense of authority and craftsmanship. The primary emotional response is one of confidence and reliability. While the mobile inspiration is compact, the desktop translation expands into a wide-format, gallery-style layout where large-scale imagery and bold headlines dominate the experience.

## Colors

The palette is strictly achromatic, punctuated by a single functional accent color.

*   **Primary (Pure Black):** Used for headlines, borders, and primary navigation elements. It represents the "Decade" brand's core strength.
*   **Neutral (Pure White):** The foundation for all surfaces. High-key backgrounds emphasize product detail and maintain a clean, clinical feel.
*   **Secondary (Mint Green):** Reserved exclusively for pricing (IDR) and success states. This provides a refreshing visual break and draws the user's eye directly to the conversion point.
*   **Tertiary (Grey Scale):** Used for sub-headers and secondary information to create a clear hierarchy without distracting from the main content.

## Typography

This design system utilizes **Hanken Grotesk** for its sharp, geometric precision and contemporary feel. 

The typographic hierarchy is aggressive. Large display titles use tight tracking and heavy weights to create a "poster" effect on desktop. Secondary labels use wide tracking and uppercase transformations to provide an architectural feel. 

On desktop, we introduce a `display-lg` tier for hero sections. On mobile, headlines should scale down by roughly 30% to maintain readability within the narrower viewport. Mint green is applied only to price labels, while all other text remains black or dark grey.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop and a **Fluid Grid** on mobile.

*   **Desktop:** A 12-column grid with a maximum container width of 1440px. Gutters are fixed at 24px to maintain a spacious, premium feel. Margins are generous (64px) to frame the content.
*   **Mobile:** A 2-column or 4-column grid with 20px side margins. 
*   **Rhythm:** All spacing (padding, margins) must be multiples of the 8px base unit. 

Product cards should adhere to a strict aspect ratio (typically 4:5) to ensure the verticality of watch photography is respected. Content reflows from a horizontal scroll on mobile to a multi-row grid on desktop.

## Elevation & Depth

This design system rejects heavy shadows in favor of **Low-Contrast Outlines** and **Tonal Layers**.

*   **Borders:** Use thin, 1px solid black or light grey borders to define segments (e.g., the search bar, product cards, and navigation buttons).
*   **Depth:** Depth is achieved through "lifted" product photography. Images are often placed on a slightly off-white surface (`#F9F9F9`) or use a very soft, diffused ambient shadow (5% opacity) to suggest they are sitting on the page.
*   **Interaction:** On hover, elements like "Buy Now" buttons or product cards should transition to a solid black fill or a slightly thicker border to indicate active state, avoiding traditional shadow-based elevation.

## Shapes

The shape language is **Pill-shaped (3)** for functional interactive elements and **Sharp (0)** for structural containers. 

*   **Interactive Elements:** Search bars, category chips, and primary action buttons utilize a full pill radius to create a soft, approachable contrast against the sharp typography.
*   **Structural Elements:** Product cards and hero sections retain sharp, 90-degree corners to maintain the architectural, high-end aesthetic. This juxtaposition between "organic" buttons and "rigid" layout is a signature of the design system.

## Components

*   **Buttons:** Primary buttons are pill-shaped with a 1px black border and black text. On hover, they invert to a black background with white text.
*   **Chips (Filters):** Small, pill-shaped containers with 1px light grey borders. Selected states use a black border and bold text.
*   **Search Bar:** A prominent, full-width pill-shaped input with a trailing circular search icon button.
*   **Product Cards:** Vertical rectangles with a 1px light grey border. The top 70% is reserved for the product image; the bottom 30% contains the product name, sub-description, and price in Mint Green.
*   **Navigation:** On mobile, a floating pill-shaped navigation bar contains icons and labels. On desktop, this expands to a top-aligned header with traditional text links, maintaining the high-contrast black/white theme.
*   **Price Labels:** Always rendered in Mint Green (`#4ADE80`), Hanken Grotesk Bold, often preceded by the "IDR" currency code in a smaller font size.