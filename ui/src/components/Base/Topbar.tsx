import { useState } from 'react';
import { MobileMenu } from './MobileMenu';
import { InfoOutlined } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import { useTransactionStore } from '../../store/transactionStore';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkMode, LightMode } from '@mui/icons-material';

/**
 * Application header with user info and mobile hamburger menu.
 * Shows user details on all screens, hamburger menu only on mobile.
 */
export function Topbar() {
    const [infoOpen, setInfoOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const transactions = useTransactionStore((state) => state.transactions);

    return (
        <>
        {/* Přidáno dark:bg-slate-900, dark:border-slate-800 a transition-colors pro plynulý přechod */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 pl-6 flex items-center justify-between md:justify-between transition-colors">
            {/* Desktop user info */}
            <div className="hidden md:block">
                {/* Přidáno dark:text-slate-100 */}
                <p className="font-semibold text-slate-800 dark:text-slate-100">Ernst Christoph Leschka</p>
                {/* Přidáno dark:text-slate-400 */}
                <p className="text-sm text-slate-500 dark:text-slate-400">Osobní číslo: A25B0266P</p>
            </div>

            {/* Mobile hamburger menu (visible only on small screens) */}
            <div className="md:hidden">
                <MobileMenu />
            </div>

            {/* Mobile user info (visible only on small screens) */}
            <div className="md:hidden text-right">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Ernst Christoph Leschka</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Osobní číslo: A25B0266P</p>
            </div>

            <div className="flex items-center">
            {/* Info icon - right side */}
                <button 
                    onClick={() => setInfoOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
                    title="Informace o projektu"
                    aria-label="Informace o projektu"
                >
                    {/* Ikona přizpůsobuje barvu automaticky, ale můžeme jí pomoct barvou textu wrapperu, nebo sx */}
                    <InfoOutlined className="text-slate-500 dark:text-slate-400" />
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Přepnout vzhled"
                    >
                    {theme === 'light' ? <DarkMode/> : <LightMode/>}
                </button>
            </div>
        </header>

        {/* Info Modal - PaperProps vnutí Tailwind třídy přímo do pozadí modálu */}
        <Dialog 
            open={infoOpen} 
            onClose={() => setInfoOpen(false)} 
            maxWidth="sm" 
            fullWidth
            classes={{
                paper: "bg-white dark:!bg-slate-900 dark:!text-slate-100 transition-colors"
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold' }}>O projektu</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <div className="space-y-4 text-sm">
                    {/* Project info header */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div className="space-y-1">
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">Autor:</span> <span className="text-slate-600 dark:text-slate-300">Ernst Christoph Leschka</span></p>
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">Předmět:</span> <span className="text-slate-600 dark:text-slate-300">KIV/UUR na ZČU FAV</span></p>
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">Práce:</span> <span className="text-slate-600 dark:text-slate-300">Správa Osobních Financí</span></p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        {/* Přidáno dark:text-slate-300 pro lepší čitelnost na tmavém pozadí */}
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            Keep Track je moderní webová aplikace navržená pro efektivní správu osobních financí a rozpočtů. 
                            Aplikace poskytuje komplexní řešení pro sledování příjmů, výdajů a kontrolu výdajů prostřednictvím 
                            flexibilního systému rozpočtů a kategorií. Uživatelé mohou snadno zaznamenávat transakce, organizovat je 
                            do vlastních kategorií a analyzovat své výdaje přes interaktivní grafy a statistiky. 
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
                            Ústředním prvkem aplikace je funkce Quick Add, která umožňuje uživatelům vytvářet šablony pro často 
                            opakované transakce, což zrychluje zaznamenávání a zlepšuje produktivitu. Aplikace také nabízí možnost 
                            rozdělovat transakce, což je užitečné při sdílení výdajů nebo detailnější analýze. Všechna data jsou  
                             <strong className="text-slate-900 dark:text-slate-100"> aktuálně</strong> spravována lokálně v prohlížeči, čímž se zajišťuje soukromí a bezpečnost uživatele.
                        </p>
                        <br />
                        <p className="text-slate-400 dark:text-slate-500 leading-relaxed">
                            Věděl jsi, že suma všech tvých kladných transakcí je <i className="text-green-600 dark:text-green-400">{transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</i>? <br /> 
                            A suma všech záporných transakcí je <i className="text-red-600 dark:text-red-400">{transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</i>!
                        </p>
                    </div>
                </div>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                <Button 
                    color="error" 
                    onClick={() => {
                        if (window.confirm("Opravdu chcete vymazat všechna data (Factory reset)? Tato akce je nevratná!")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                >
                    Factory Reset
                </Button>
                {/* Zde můžeš využít variantu outlined, pokud by plné tlačítko na tmavém pozadí příliš svítilo */}
                <Button onClick={() => setInfoOpen(false)} variant={theme === 'dark' ? 'outlined' : 'contained'}>
                    Zavřít
                </Button>
            </DialogActions>
        </Dialog>
        </>
    )
}