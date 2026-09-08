# UI/UX & Design Guidelines for keep-track

## Core Layout & Modals
- **Secondary Actions & Settings**: Do not clutter the main dashboard or primary action areas with inline checkboxes, toggles, or secondary settings (e.g., placing a configuration toggle directly under a primary "Import" button).
- **Confirmation Modals**: Prefer using confirmation modals or dialogs to ask the user for secondary configurations (like "Use smart categorization?") _after_ they have triggered the primary action, but _before_ committing the action.
- **Component Library**: The project uses `@mui/material`. Utilize standard MUI components (`Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`) for modals.

## Visual Design & Aesthetics (No AI Clichés)
- **Palette**: Do not use the color `indigo` anywhere in styles or Tailwind utility classes. Prefer clean slate, sky, and emerald palettes.
- **No Floating Bubbles**: Do not include floating animated blurred orbs, gradient blobs, or `animate-blob` decorative elements.
- **Authentic Product Previews**: Product snapshots, hero mockups, or UI previews must closely mirror the real KeepTrack interface (e.g. authentic StatCards with trend badges, QuickAdd button columns, and LastTransactions filter tabs) rather than inventing unrepresentative gauges or abstract skeleton cards.

## Terminology & Marketing Copy
- **Strictly No "AI"**: Never use the word "AI" in user-facing copy or localization keys. Use "smart", "LLM", or "OpenRouter" when describing automated categorization or model features.
- **Audience Focus**: Keep primary copy focused on everyday personal finance benefits (clarity, stress-free budget tracking, recurring expenses). Technical stack references (NestJS, PostgreSQL, Docker, etc.) belong strictly in footer sections.
- **Purposeful CTAs**: Avoid cluttered layouts with multiple duplicate CTA buttons directing to the exact same route.

## External Data & Loading States
- **Graceful Loading Over Fake Fallbacks**: If external dynamic feeds (e.g. GitHub Issues) are loading, rate-limited, or unavailable, display matching animated skeleton loaders. Do not display arbitrary synthetic fallback text cards or disruptive warning banners.

## Localization & Sizing
- **Full Synchronization**: All user-facing strings must be localized in both English (`ui/src/locales/en/translation.json`) and Czech (`ui/src/locales/cs/translation.json`).
- **Concise Preview Labels**: In compact grids or miniature previews (e.g. StatCards), provide dedicated concise translation keys (e.g. "Income" / "Příjmy" rather than "Income this month") to prevent label truncation.
