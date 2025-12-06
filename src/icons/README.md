# Icons Directory

This directory contains all icon files organized by frame/screen.

## Folder Structure

```
icons/
├── header/          # Header icons (hamburger menu, calendar, graph, profile)
├── habits/          # Habit card icons (flame, checkbox, habit icons)
├── bottom-nav/      # Bottom navigation icons (home, groups, calendar, profile)
├── floating-button/ # Floating action button icon (plus)
└── other/           # Other miscellaneous icons
```

## How to Add Icons

1. Export icons from Figma as SVG files
2. Save them in the appropriate folder based on where they're used
3. Import them in your components like this:

```typescript
// For SVG files
import HamburgerIcon from '@/icons/header/hamburger.svg';

// Or use Next.js Image for PNG/JPG
import Image from 'next/image';
import CalendarIcon from '@/icons/header/calendar.png';
```

## Naming Convention

Use descriptive, lowercase names with hyphens:
- `hamburger-menu.svg`
- `calendar-icon.svg`
- `flame-icon.svg`
- `home-active.svg`
- `home-inactive.svg`

