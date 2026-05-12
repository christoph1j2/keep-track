import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StyleIcon from '@mui/icons-material/Style';

interface MenuItem {
    title: string,
    icon: ReactNode,
    path: string,
    isActive?: boolean
}

/**
 * Navigation menu items for the app shell.
 * Links to main pages: Dashboard (/), Overview (/overview), Budgeting (/budgeting), Quick Add templates (/quickadd).
 */
const MENU_ITEMS: MenuItem[] = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/', isActive: true },
    { title: 'Přehled', icon: <ShowChartIcon />, path: '/overview' },
    { title: 'Rozpočty', icon: <AccountBalanceWalletIcon />, path: '/budgeting' },
    { title: 'Šablony', icon: <StyleIcon />, path: '/quickadd' },
];

/**
 * Static left navigation panel shown on desktop (md breakpoint and up).
 * Displays logo and menu items; hidden on mobile via Tailwind's responsive utilities.
 */
export function Sidebar() {
    return (
        <aside className="hidden md:flex md:w-64 flex-col items-start p-6 bg-white border-r border-slate-200">
            {/* logo */}
            <div className='mb-10'>
                <h1 className='text-2xl font-bold text-blue-700 flex items-center'>
                    <StyleIcon className="text-slate-900 mr-1" />
                    Keep<span className='text-slate-800'>Track</span>
                </h1>
            </div>

            {/* navigation */}
            <nav className='flex flex-col gap-2'>
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.title}
                        to={item.path} // Kam odkaz vede
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                            isActive
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        {item.icon}
                        {item.title}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}