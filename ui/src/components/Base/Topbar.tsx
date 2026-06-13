import { useState } from 'react';
import { MobileMenu } from './MobileMenu';
import { InfoOutlined } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import { useTransactionStore } from '../../store/transactionStore';

/**
 * Application header with user info and mobile hamburger menu.
 * Shows user details on all screens, hamburger menu only on mobile.
 */
export function Topbar() {
    const [infoOpen, setInfoOpen] = useState(false);
    const transactions = useTransactionStore((state) => state.transactions);

    return (
        <>
        <header className="h-16 bg-white border-b border-slate-200 p-3 pl-6 flex items-center justify-between md:justify-start">
            {/* Desktop user info */}
            <div className="hidden md:block">
                <p className="font-semibold">Ernst Christoph Leschka</p>
                <p className="text-sm text-slate-500">Osobní číslo: A25B0266P</p>
            </div>

            {/* Mobile hamburger menu (visible only on small screens) */}
            <div className="md:hidden">
                <MobileMenu />
            </div>

            {/* Mobile user info (visible only on small screens) */}
            <div className="md:hidden text-right">
                <p className="font-semibold text-sm">Ernst Christoph Leschka</p>
                <p className="text-xs text-slate-500">Osobní číslo: A25B0266P</p>
            </div>

            {/* Info icon - right side */}
            <button 
                onClick={() => setInfoOpen(true)}
                className="ml-auto p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Informace o projektu"
                aria-label="Informace o projektu"
            >
                <InfoOutlined sx={{ color: 'text.secondary' }} />
            </button>
        </header>

        {/* Info Modal */}
        <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>O projektu</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <div className="space-y-4 text-sm">
                    {/* Project info header */}
                    <div className="border-b border-slate-200 pb-3">
                        <div className="space-y-1">
                            <p><span className="font-semibold">Autor:</span> Ernst Christoph Leschka</p>
                            <p><span className="font-semibold">Předmět:</span> KIV/UUR na ZČU FAV</p>
                            <p><span className="font-semibold">Práce:</span> Správa Osobních Financí</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-slate-700 leading-relaxed">
                            Keep Track je moderní webová aplikace navržená pro efektivní správu osobních financí a rozpočtů. 
                            Aplikace poskytuje komplexní řešení pro sledování příjmů, výdajů a kontrolu výdajů prostřednictvím 
                            flexibilního systému rozpočtů a kategorií. Uživatelé mohou snadno zaznamenávat transakce, organizovat je 
                            do vlastních kategorií a analyzovat své výdaje přes interaktivní grafy a statistiky. 
                        </p>
                        <p className="text-slate-700 leading-relaxed mt-2">
                            Ústředním prvkem aplikace je funkce Quick Add, která umožňuje uživatelům vytvářet šablony pro často 
                            opakované transakce, což zrychluje zaznamenávání a zlepšuje produktivitu. Aplikace také nabízí možnost 
                            rozdělovat transakce, což je užitečné při sdílení výdajů nebo detailnější analýze. Všechna data jsou  
                             <strong> aktuálně</strong> spravována lokálně v prohlížeči, čímž se zajišťuje soukromí a bezpečnost uživatele.
                        </p>
                        <br />
                        <p className="text-slate-400 leading-relaxed">
                            Věděl jsi, že suma všech tvých kladných transakcí je <i>{transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</i>? <br /> A suma všech záporných transakcí je <i>{transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</i>!
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
                <Button onClick={() => setInfoOpen(false)} variant="contained">
                    Zavřít
                </Button>
            </DialogActions>
        </Dialog>
        </>
    )
}