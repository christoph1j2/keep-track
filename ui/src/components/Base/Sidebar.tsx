import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import StyleIcon from '@mui/icons-material/Style';
import { Extension } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MenuItem {
    translationKey: string,
    icon: ReactNode,
    path: string,
    isActive?: boolean
}

/**
 * Static navigation model for the desktop sidebar.
 * Each entry maps a title and icon to a route.
 */
const MENU_ITEMS: MenuItem[] = [
    { translationKey: 'sidebar.dashboard', icon: <DashboardIcon />, path: '/', isActive: true },
    { translationKey: 'sidebar.overview', icon: <ShowChartIcon />, path: '/overview' },
    { translationKey: 'sidebar.categories', icon: <CategoryIcon />, path: '/categories' },
    { translationKey: 'sidebar.budgeting', icon: <AccountBalanceWalletIcon />, path: '/budgeting' },
    { translationKey: 'sidebar.quickAdd', icon: <Extension />, path: '/quickadd' },
    { translationKey: 'sidebar.settings', icon: <SettingsIcon />, path: '/settings' },
];

/**
 * Left-side navigation shown on medium screens and up.
 * Hidden on mobile so the main content can use full width.
 */
export function Sidebar() {
    const { t } = useTranslation();

    return (
        <aside className="hidden md:flex md:w-64 flex-col items-start p-6 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            {/* logo */}
            <div className='mb-10'>
                <h1 className='text-2xl font-bold text-blue-700 flex items-center dark:text-blue-500 transition-colors'>
                    <StyleIcon className="text-slate-900 mr-1 dark:text-slate-200" />
                    Keep<span className='text-slate-800 dark:text-slate-200'>Track</span>
                </h1>
            </div>

            {/* navigation */}
            <nav className='flex flex-col gap-2'>
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.translationKey}
                        to={item.path} // Kam odkaz vede
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                            isActive
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-colors'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors'
                        }`}
                    >
                        {item.icon}
                        {t(item.translationKey)}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}