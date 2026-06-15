import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { ReactNode } from 'react';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StyleIcon from '@mui/icons-material/Style';
import CategoryIcon from '@mui/icons-material/Category';

interface MenuItem {
    translationKey: string;
    icon: ReactNode;
    path: string;
}

const MENU_ITEMS: MenuItem[] = [
    { translationKey: 'sidebar.dashboard', icon: <DashboardIcon />, path: '/' },
    { translationKey: 'sidebar.overview', icon: <ShowChartIcon />, path: '/overview' },
    { translationKey: 'sidebar.categories', icon: <CategoryIcon />, path: '/categories' },
    { translationKey: 'sidebar.budgeting', icon: <AccountBalanceWalletIcon />, path: '/budgeting' },
    { translationKey: 'sidebar.quickadd', icon: <StyleIcon />, path: '/quickadd' },
];

/**
 * Mobile navigation drawer that opens from the left side.
 * Closes automatically when route changes.
 */
export function MobileMenu() {
    const [openedPath, setOpenedPath] = useState<string | null>(null);
    const location = useLocation();
    const isOpen = openedPath === location.pathname;

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' ||
                (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }
        setOpenedPath(open ? location.pathname : null);
    };

    return (
        <>
            {/* Drawer */}
            <Drawer 
                open={isOpen} 
                onClose={toggleDrawer(false)}
                classes={{
                    paper: "dark:bg-slate-900" // Overrides the default white MUI background in dark mode
                }}
            >
                <div className="w-64 flex flex-col h-full bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
                    {/* Logo section */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-500 flex items-center gap-2">
                            <StyleIcon className="text-slate-900 dark:text-slate-200" />
                            Keep<span className="text-slate-800 dark:text-slate-200">Track</span>
                        </h1>
                    </div>

                    {/* Navigation list */}
                    <List className="flex-1 px-2 py-4">
                        {MENU_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <ListItem key={item.translationKey} disablePadding>
                                    <ListItemButton
                                        component={NavLink}
                                        to={item.path}
                                        className={`rounded-xl mb-2 transition-colors ${
                                            isActive
                                                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors'
                                        }`}
                                    >
                                        <ListItemIcon className={isActive ? 'text-slate-900! dark:text-slate-100!' : 'text-slate-600! dark:text-slate-400!'}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.translationKey} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </div>
            </Drawer>

            {/* Hamburger button trigger */}
            <button
                onClick={toggleDrawer(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Open menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>
        </>
    );
}
