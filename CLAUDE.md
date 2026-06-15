# KeepTrack - Personal Finance Tracker

A modern personal finance tracking application built with React, TypeScript, and Vite, featuring dark mode, responsive design, and efficient state management using Zustand.

## Response Size Constraints
- Never produce a single response large enough to hit token limits.
- When a task involves rewriting or translating large files, write one or two functions/files per turn and stop.
- Do not chain massive blocks of text or multiple file writes inside a single response turn. 
- Break the implementation into distinct, human-approved phases.

## Project Structure

```
keep-track/
├── api/                    # Backend API (if applicable)
├── ui/                     # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (ThemeContext)
│   │   ├── layouts/        # Layout components (MainLayout)
│   │   ├── pages/          # Page components (Dashboard, Overview, Budgeting, etc.)
│   │   ├── store/          # Zustand state stores
│   │   ├── hooks/          # Custom hooks (useMobile, ...)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Root app component with routing
│   │   ├── main.tsx        # App entry point
│   │   └── index.css       # Global styles (Tailwind CSS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
├── .vscode/                # VSCode settings
└── MEMORY.md              # Claude Code memory index
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **MaterialUI** - Most UI components
- **Zustand** - State management with localStorage persistence
- **Tailwind CSS** - Utility-first CSS framework
- **DnD Kit** - Drag and drop for reordering
- **D3.js** - Data visualization

## State Management

The application uses Zustand for global state management with localStorage persistence:

### Available Stores

1. **useBudgetStore** (`src/store/budgetStore.ts`)
   - Manages budget limits per category
   - Persists as `keep-track-budgets`

2. **useTemplateStore** (`src/store/quickAddTemplateStore.ts`)
   - Manages quick add templates
   - Persists as `keep-track-quick-add-templates`

3. **ThemeContext** (`src/contexts/ThemeContext.tsx`)
   - Manages light/dark theme preference
   - Uses localStorage and system preference detection

4. **useTransactionStore** (`src/store/transactionStore.ts`)
   - Manages transactions
   - Persists as `keep-track-transactions`

5. **useCategoryStore** (`src/store/categoryStore.ts`)
   - Manages categories
   - Persists as `keep-track-categories`

## Data Models

### Transaction (`src/types/transaction.ts`)
```typescript
interface Transaction {
    id: string;
    title: string;
    amount: number;  // Negative for expenses, positive for income
    categoryId: string;
    date: string;    // ISO format
}
```

### Category (`src/types/category.ts`)
```typescript
interface Category {
    id: string;
    label: string;
    iconName: string;
    colorClass: string;
    parentId?: string;  // Optional parent for hierarchy
}
```

### QuickAddTemplate (`src/types/quickadd.ts`)
```typescript
interface QuickAddTemplate {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    showInHotbar?: boolean;  // Defaults to true
    order?: number;          // For sorting within hotbar
}
```

### Budget (`src/types/budget.ts`)
```typescript
interface Budget {
    categoryId: string;
    limit: number;
}
```

## Routing

- `/` - Dashboard
- `/overview` - Overview page
- `/categories` - Category management
- `/budgeting` - Budget tracking
- `/quickadd` - Quick add transaction
- `*` - 404 page

## Development

```bash
# Install dependencies
cd ui
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

- **Base URL**: Production builds use `/keep-track/` as base URL
- **Theme**: Automatically detects system preference, falls back to localStorage setting
- **Persistence**: All state stores use localStorage with specific names for isolation

## Key Features

- Dark mode with system preference detection
- Responsive design with Tailwind CSS
- Drag-and-drop reordering for budgets and templates
- Persistent state across sessions
- Type-safe throughout

## Future Roadmap

- Complete backend via NestJS
- Some sort of OpenBankingAPI to connect to ones bank account (so that the user only needs to track payments with cash, etc.)
- Modify the transaction model to include a boolean `isIncome` to improve UX creating transactions (no need for negative values)
- OpenRouter/free to improve smart categorization ... maybe to also check market trends and make suggestions (where the user spends the most money, etc).
- VPS deployment 