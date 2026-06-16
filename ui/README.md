
# 💸 Keep Track - Frontend

Moderní, rychlá a plně responzivní webová aplikace pro efektivní správu osobních financí a rozpočtů. Aplikace je navržena jako plnohodnotná **PWA (Progressive Web App)**, funguje offline a veškerá uživatelská data momentálně uchovává lokálně v prohlížeči.

Tento repozitář obsahuje klientskou část (frontend), která je připravena na budoucí napojení na plnohodnotný backend.

## ✨ Hlavní funkce

- 📱 **PWA (Installable):** Aplikaci lze nainstalovat na plochu mobilu i počítače pro nativní zážitek.
- 🌙 **Dark/Light Mode:** Plná podpora tmavého režimu napříč celým UI.
- 🌍 **Lokalizace (i18n):** Přeloženo do češtiny a angličtiny s možností plynulého přepínání.
- 💱 **Dynamická měna:** Volba hlavní měny (CZK, EUR, USD, GBP) s automatickým formátováním.
- ⚡ **Quick Add Šablony:** Rychlé zadávání opakujících se transakcí na jedno kliknutí.
- 📊 **Interaktivní grafy:** Vizualizace příjmů a výdajů v čase.
- 💰 **Rozpočty a Kategorie:** Možnost tvorby vlastních kategorií a hlídání měsíčních rozpočtů.
- 💾 **Local First:** Veškerá data (stav, nastavení, transakce) jsou bezpečně uchována v `localStorage`.

## 🛠️ Použité technologie

- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first approach)
- **Komponenty:** [Material UI (MUI)](https://mui.com/) & MUI X-Charts
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Internacionalizace:** `i18next` & `react-i18next`
- **PWA:** `vite-plugin-pwa`

## 🚀 Jak spustit projekt lokálně

### Předpoklady
- Nainstalovaný [Node.js](https://nodejs.org/) (ideálně verze 18 a novější).

### Instalace

1. Otevřete složku frontendu:
   ```bash
   cd ui
    ```

2. Nainstalujte závislosti:
  ```bash
  npm install
  ```


3. Spusťte vývojový server:
```bash
npm run dev
```


4. Aplikace poběží na adrese `http://localhost:5173`.

### 📦 Sestavení pro produkci (včetně PWA Service Workeru)

Pro otestování PWA funkcí (instalace, offline chod) je nutné aplikaci sestavit:

```bash
npm run build
npm run preview
```

## 📂 Struktura projektu

* `src/components/` - Znovupoužitelné UI komponenty (Modály, Tlačítka, Grafy).
* `src/contexts/` - React Contexty (např. ThemeContext pro přepínání vzhledu).
* `src/hooks/` - Vlastní React hooky (např. detekce mobilního zařízení).
* `src/locales/` - JSON slovníky pro překlady aplikací (`cs` a `en`).
* `src/pages/` - Hlavní pohledy aplikace (Dashboard, Settings, Overview...).
* `src/store/` - Zustand definice stavů (Transactions, Budgets, Settings...).
* `src/utils/` - Pomocné funkce (formátování, generování dat).

## 🚧 Plánovaný vývoj (Roadmap)

Současná verze slouží jako robustní klient. V dalších fázích plánujeme:

* Migraci dat z `localStorage` do PostgreSQL databáze.
* Napojení na bankovní API (GoCardless/Nordigen) pro automatický import výpisů.
* Integraci AI analytika (analýza výdajů a generování doporučení).
* Podporu více uživatelů (sdílené rozpočty pro rodiny).

