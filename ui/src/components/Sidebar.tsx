import type { ReactNode } from 'react';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StyleIcon from '@mui/icons-material/Style';

interface MenuItem {
    title: string,
    icon: ReactNode,
    isActive?: boolean
}

const MENU_ITEMS: MenuItem[] = [
    { title: 'Dashboard', icon: <DashboardIcon />, isActive: true },
    { title: 'Přehled', icon: <ShowChartIcon /> },
    { title: 'Rozpočty', icon: <AccountBalanceWalletIcon /> },
    { title: 'Šablony', icon: <StyleIcon /> },
];

export function Sidebar() {
    return (
        <aside className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col h-full">
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
                    <button
                        key={item.title}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                            item.isActive
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        {item.icon}
                        {item.title}
                    </button>
                ))}
            </nav>
        </aside>
    );
}