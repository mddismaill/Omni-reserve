---
name: App.tsx import corruption
description: Pre-existing duplicate/corrupted footer and bottom navigation fragment in src/App.tsx that breaks TypeScript compilation.
---

# App.tsx Import Corruption

When this project was imported from GitHub, `src/App.tsx` contained a duplicated and partially corrupted footer + bottom navigation fragment near the end of the file. This caused TypeScript errors such as:

- `JSX element 'AnimatePresence' has no corresponding closing tag`
- `Unterminated string literal`
- `Expected corresponding JSX closing tag for 'footer'`

## Why this happened

The corruption appears to be from a duplicate insertion of the footer, bottom navigation dock, and AI chatbot markup. The clean version lives at the very end of the file (around the closing tags). The corrupted duplicate sits just above the "Floating Upcoming Booking Alerts Toast Center" section.

## How to apply

1. Identify the corrupted fragment: it starts with the first `Sticky subtle footer` comment after the main content and ends with a partial/leftover bottom navigation block (`</div>` after `})}`).
2. Remove that entire corrupted fragment.
3. Keep the clean footer, bottom navigation dock, and AI chatbot section that follows the alerts section.
4. Apply the new tab and module changes to the clean navigation dock, not the corrupted fragment.

**Why:** The clean footer/nav section is the only valid one. Editing the corrupted fragment causes further syntax errors and makes the file unbuildable.
