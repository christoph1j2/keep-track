# 💸 Keep Track - Frontend

Modern, fast, and fully responsive web application for efficient personal finance and budget management. It works offline and currently stores all user data locally in the browser.

This repository contains the client-side (frontend) code, which is prepared for future connection to a full backend.

## ✨ Key Features

- 🌙 **Dark/Light Mode:** Full dark mode support across the entire UI with automatic system preference detection.
- 🌍 **Localization (i18n):** Translated into Czech and English with seamless switching.
- 💱 **Dynamic Currency:** Choice of main currency (CZK, EUR, USD, GBP) with automatic formatting.
- ⚡ **Quick Add Templates:** Quick entry of recurring transactions with one click and drag-and-drop reordering.
- 📊 **Interactive Charts:** Visualization of income and expenses over time.
- 💰 **Budgets and Categories:** Ability to create custom categories and monitor monthly budgets.
- 💾 **Local First:** All data (state, settings, transactions) are safely stored in `localStorage`.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Components:** [Material UI (MUI)](https://mui.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com/)
- **Charts:** [D3.js](https://d3js.org/)

## 🚀 How to run locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or newer).

### Installation

1. Open the frontend directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application will be running at `http://localhost:5173`.

### 📦 Production Build

The application can be built for production using the following commands:

```bash
npm run build
npm run preview
```

## 📂 Project Structure

* `src/components/` - Reusable UI components (Modals, Buttons, Charts).
* `src/contexts/` - React Contexts (e.g., ThemeContext for appearance switching).
* `src/hooks/` - Custom React hooks.
* `src/layouts/` - Layout components (MainLayout).
* `src/locales/` - JSON dictionaries for application translations (`cs` and `en`).
* `src/pages/` - Main application views (Dashboard, Settings, Overview...).
* `src/store/` - Zustand state definitions (Transactions, Budgets, Settings...).
* `src/utils/` - Helper functions (formatting, data generation).
* `src/types/` - TypeScript type definitions.

