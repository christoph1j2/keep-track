# UI/UX Guidelines for keep-track

- **Secondary Actions & Settings**: Do not clutter the main dashboard or primary action areas with inline checkboxes, toggles, or secondary settings (e.g., placing a configuration toggle directly under a primary "Import" button).
- **Confirmation Modals**: Prefer using confirmation modals or dialogs to ask the user for secondary configurations (like "Use AI?") *after* they have triggered the primary action, but *before* committing the action.
- **Component Library**: The project uses `@mui/material`. Utilize standard MUI components (`Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`) for modals.
