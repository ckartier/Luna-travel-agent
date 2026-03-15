---
name: brand-luna
description: "Applies Luna Conciergerie's official brand identity (colors, typography, shadows, spacing) to any artifact — emails, PDFs, spreadsheets, presentations, or web components. Use it when Luna brand colors, fonts, or design standards should be applied."
---

# Luna Brand Identity

## Overview

Use this skill to apply **Luna Conciergerie**'s official brand identity to any artifact that needs consistent Luna visual styling.

**Keywords**: branding, Luna, conciergerie, travel, visual identity, styling, brand colors, typography, design standards

---

## Brand Guidelines

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `luna-bg` | `#F8FAFC` | Main background |
| `luna-charcoal` | `#2E2E2E` | Primary text, headings |
| `luna-text` | `#2E2E2E` | Body text |
| `luna-text-muted` | `#6B7280` | Secondary text, captions |
| `luna-warm-gray` | `#F5F5F5` | Secondary backgrounds |
| `luna-cream` | `#FFFFFF` | Card backgrounds |
| `luna-border` | `#E5E7EB` | Borders, dividers |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `luna-primary` | `#bcdeea` | Primary accent (buttons, links, highlights) |
| `luna-primary-hover` | `#a5cfdf` | Hover state for primary |
| `luna-red` | `#da3832` | Error, destructive actions |
| `luna-red-hover` | `#c22f2a` | Hover state for red |

### Category Palette (Pastel)

| Token | Hex | Usage |
|-------|-----|-------|
| `cat-hotel` | `#E3E2F3` | Hotel category |
| `cat-activity` | `#D3E8E3` | Activities category |
| `cat-transfer` | `#E6D2BD` | Transfers category |
| `cat-dining` | `#F2D9D3` | Dining category |
| `cat-other` | `#F3F4F6` | Other category |

---

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Body | Inter | 400 | 14px |
| Headings | Inter | 500 | varies |
| Labels | Inter | 500, uppercase | 11px |
| UI Elements | Inter | 400-500 | 14px |

**Fallback stack**: `"Inter", ui-sans-serif, system-ui, sans-serif`

**Rules**:
- No bold (`font-weight: 700`). Use `500` (medium) for emphasis.
- Letter-spacing: `tracking-tight` for titles, `tracking-wider` for labels
- Text size: Default `14px`, never below `11px`

---

### Shadows (Soft, 2026 System)

| Level | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` | Buttons, inputs |
| `md` | `0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)` | Cards, panels |
| `lg` | `0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02)` | Hover states, dropdowns |
| `xl` | `0 8px 30px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)` | Modals, overlays |

---

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | `12px` |
| Cards | `16px` |
| Inputs | `12px` |
| Dropdowns | `14px` |
| Modals | `20px` |
| Tables | `12px` |

---

### Spacing & Layout

- **Focus ring**: `0 0 0 3px rgba(188, 222, 234, 0.3)` with `border-color: #bcdeea`
- **Card hover**: Shadow transitions from `md` to `lg`
- **Transition timing**: `0.2s ease`

---

## Application Rules

### For HTML/Email
```css
body {
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  color: #2E2E2E;
  background: #F8FAFC;
}

h1, h2, h3 { font-weight: 500; color: #2E2E2E; }
a { color: #5a8fa3; }
.accent { background: #bcdeea; }
.card { background: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; }
```

### For XLSX (openpyxl)
```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

LUNA_FONT = Font(name="Arial", size=10, color="2E2E2E")
LUNA_HEADER = Font(name="Arial", size=11, color="2E2E2E", bold=True)
LUNA_ACCENT_FILL = PatternFill("solid", fgColor="BCDEEA")
LUNA_BG_FILL = PatternFill("solid", fgColor="F8FAFC")
LUNA_BORDER = Border(
    left=Side(style="thin", color="E5E7EB"),
    right=Side(style="thin", color="E5E7EB"),
    top=Side(style="thin", color="E5E7EB"),
    bottom=Side(style="thin", color="E5E7EB"),
)
```

### For PDF (reportlab)
```python
from reportlab.lib.colors import HexColor

LUNA_CHARCOAL = HexColor("#2E2E2E")
LUNA_PRIMARY = HexColor("#bcdeea")
LUNA_BG = HexColor("#F8FAFC")
LUNA_BORDER = HexColor("#E5E7EB")
LUNA_MUTED = HexColor("#6B7280")
```

---

## Logo

- **Light backgrounds**: Use `luna-logo-noir.png` or `luna-logo-black.svg`
- **Dark backgrounds**: Use `luna-logo-white.svg`
- **Brand accent**: Use `luna-logo-blue.svg`
- **Premium contexts**: Use `luna-logo-premium.svg`

Logo files: `/public/luna-logo-*.{svg,png}`

---

## Tagline

- **EN**: "Travel beautifully."
- **FR**: "Voyagez autrement."

## Legal Name
- `Luna Conciergerie`
- URL: `www.luna-conciergerie.com`
