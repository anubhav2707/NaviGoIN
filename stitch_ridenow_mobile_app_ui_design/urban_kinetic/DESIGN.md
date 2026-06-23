---
name: Urban Kinetic
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#0040df'
  on-secondary: '#ffffff'
  secondary-container: '#2d5bff'
  on-secondary-container: '#efefff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1b'
  on-tertiary-container: '#858383'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c3ff'
  on-secondary-fixed: '#001355'
  on-secondary-fixed-variant: '#0035bd'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  button-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for a high-fidelity, urban mobility experience that prioritizes trust, speed, and precision. The brand personality is "Quietly Premium"—it avoids unnecessary decoration to focus on utility and clarity in a fast-paced environment.

The visual style is **Corporate / Modern** with a heavy influence from **Minimalism**. It utilizes expansive white space, a strictly disciplined color palette, and high-contrast primary actions to guide users through the booking flow with zero friction. The aesthetic reflects a reliable, institutional presence suitable for the diverse and demanding Indian transit landscape, from premium sedans to nimble bike taxis.

## Colors

This design system employs a high-contrast palette to ensure legibility under varying outdoor lighting conditions.

- **Primary (Black):** Used for critical conversion points, primary buttons, and core branding. It signifies authority and stability.
- **Secondary (Electric Blue):** Reserved for "Live" data—route lines on maps, active ride status, and interactive selection states. It provides a digital pulse to the interface.
- **Neutral (Grays):** A scale of neutrals from deep charcoal (#121212) for body text to subtle dividers (#F1F1F1) and surface offsets (#F8F8F8) to create structural hierarchy without visual noise.
- **Functional Colors:** Success green for completed payments/UPI confirmations and warning amber for delays or vehicle updates.

## Typography

The typography system is built on **Inter**, chosen for its exceptional legibility at small sizes and its neutral, systematic character.

- **Scale:** A tight typographic scale ensures that information-dense screens (like ride options or price breakdowns) remain organized.
- **Weight:** Medium and Semi-bold weights are used strategically for vehicle types (e.g., "Auto", "Premier") to ensure they stand out against price points.
- **Indian Context:** Support for regional scripts must maintain the same x-height and optical weight as the Latin set to ensure a seamless experience in multi-lingual settings.

## Layout & Spacing

The layout follows a **Fluid Grid** model based on a 4px baseline shift, optimized for one-handed mobile use.

- **The "Thumb Zone":** All primary interactive elements (Ride booking, payment selection) are anchored to the bottom 40% of the screen.
- **Margins:** A consistent 16px lateral margin is applied across all mobile views.
- **Map Integration:** The map is the foundation layer. UI elements are treated as floating sheets or "Drawers" that slide over the map, ensuring the user never loses their geographical context.
- **Vertical Rhythm:** Use 8px and 16px increments to separate logical groups (e.g., Vehicle type from ETA).

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to define the relationship between the map and the interface.

- **Level 0 (Floor):** The Map. Deep-set, slightly desaturated to allow UI overlays to pop.
- **Level 1 (Sheets):** White surfaces (#FFFFFF) that contain ride details. These use a very soft, highly diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) to appear as if floating just above the map.
- **Level 2 (Modals/Pop-overs):** Used for payment method selection (UPI/Cash). These have a slightly more pronounced shadow to indicate temporary focus.
- **Dividers:** Hairline borders (#F1F1F1) are preferred over shadows for internal card organization to maintain a clean, "flat" premium look.

## Shapes

The shape language is defined by **Rounded (0.5rem / 8px - 12px)** geometry.

- **Primary Containers:** Bottom sheets and ride-option cards use a 12px corner radius (`rounded-lg`) to feel modern yet approachable.
- **Small Elements:** Buttons and input fields use an 8px radius to maintain a precise, engineered feel.
- **Pills:** Status indicators (e.g., "Fastest", "Discount") use a fully rounded/pill shape to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Pure black (#000000) background, white text. No gradient. 12px radius. Full-width for mobile CTAs.
- **Secondary/Ghost:** White background with #F1F1F1 border. Used for "Cancel" or "Add Stop".

### Ride Selection Cards
- **State:** Unselected cards have no border. Selected cards feature a 2px black border or a subtle Electric Blue highlight.
- **Layout:** Icon on left (Auto, Bike, Car), Type and Capacity in center, Price and ETA on right.

### Input Fields
- **Search:** Clean, 8px rounded boxes with #F8F8F8 fill. 
- **Waypoints:** Use a distinct visual language—a Blue Dot for pickup and a Black Square for destination, connected by a vertical dashed line.

### Payment & UPI
- **UPI Integration:** A dedicated component for quick-switching between saved UPI IDs and Cash, featuring the official UPI logo for instant recognition and trust.

### Vehicle Icons
- **Style:** Minimalist, top-down or 3/4 view line icons. Must be distinct enough to differentiate between a hatchback, sedan, and an auto-rickshaw at a glance.