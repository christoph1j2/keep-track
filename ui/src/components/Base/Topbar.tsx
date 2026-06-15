import { useState } from 'react';
import { MobileMenu } from './MobileMenu';
import { InfoOutlined } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import { useTransactionStore } from '../../store/transactionStore';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useConfirmStore } from '../../store/confirmStore'; // Přidán globální store pro potvrzení

/**
 * Application header with user info and mobile hamburger menu.
 * Shows user details on all screens, hamburger menu only on mobile.
 */
export function Topbar() {
    const [infoOpen, setInfoOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const transactions = useTransactionStore((state) => state.transactions);
    
    // Nové hooky
    const { t } = useTranslation();
    const showConfirm = useConfirmStore((state) => state.showConfirm);

    // Výpočet statistik pro modal
    const incomeSum = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expensesSum = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);

    return (
        <>
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 pl-6 flex items-center justify-between md:justify-between transition-colors">
            {/* Desktop user info */}
            <div className="hidden md:block">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Ernst Christoph Leschka</p>
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
                    title={t("topbar.tooltips.info")}
                    aria-label={t("topbar.tooltips.info")}
                >
                    <InfoOutlined className="text-slate-500 dark:text-slate-400" />
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title={t("topbar.tooltips.theme")}
                    >
                    {theme === 'light' ? <DarkMode/> : <LightMode/>}
                </button>
            </div>
        </header>

        {/* Info Modal */}
        <Dialog 
            open={infoOpen} 
            onClose={() => setInfoOpen(false)} 
            maxWidth="sm" 
            fullWidth
            classes={{
                paper: "bg-white dark:!bg-slate-900 dark:!text-slate-100 transition-colors"
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold' }}>{t("topbar.about.title")}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <div className="space-y-4 text-sm">
                    {/* Project info header */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div className="space-y-1">
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">{t("topbar.about.author")}:</span> <span className="text-slate-600 dark:text-slate-300">Ernst Christoph Leschka</span></p>
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">{t("topbar.about.subject")}:</span> <span className="text-slate-600 dark:text-slate-300">KIV/UUR na ZČU FAV</span></p>
                            <p><span className="font-semibold text-slate-800 dark:text-slate-100">{t("topbar.about.work")}:</span> <span className="text-slate-600 dark:text-slate-300">{t("topbar.about.workName")}</span></p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {t("topbar.about.description1")}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
                            {t("topbar.about.description2")} <strong className="text-slate-900 dark:text-slate-100">{t("topbar.about.currently")}</strong> {t("topbar.about.description3")}
                        </p>
                        <br />
                        <p className="text-slate-400 dark:text-slate-500 leading-relaxed">
                            {t("topbar.about.statsIncome", { 
                                income: incomeSum.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' }) 
                            })}
                            <span className="text-green-600 dark:text-green-400 font-italic hidden"></span> {/* Jen pro zachování tvých barev, pokud bys to chtěl obalit */}
                            <br /> 
                            {t("topbar.about.statsExpenses", { 
                                expenses: expensesSum.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' }) 
                            })}
                        </p>
                    </div>
                </div>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                <Button 
                    color="error" 
                    onClick={() => {
                        // Využití našeho globálního dialogu místo window.confirm
                        showConfirm(
                            t("topbar.confirm.resetTitle"),
                            t("topbar.confirm.resetMessage"),
                            () => {
                                localStorage.clear();
                                window.location.reload();
                            }
                        );
                    }}
                >
                    {t("topbar.buttons.factoryReset")}
                </Button>
                <Button onClick={() => setInfoOpen(false)} variant={theme === 'dark' ? 'outlined' : 'contained'}>
                    {t("topbar.buttons.close")}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    )
}