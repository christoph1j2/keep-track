import type { ReactNode } from 'react';
import { Sidebar } from '../components/Base/Sidebar';
import { Topbar } from '../components/Base/Topbar';

/**
 * Main application layout shell combining navigation sidebar, header topbar, and scrollable content area.
 * Uses flexbox to maintain fixed sidebar/header with scrollable main content; responsive on mobile (sidebar hidden).
 *
 * @param props.children Page content rendered in the main area.
 */
export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-50">
            {/* side panel */}
            <Sidebar />

            <div className="flex-1 flex flex-col w-full overflow-y-auto">
                {/* top bar */}
                <Topbar />

                {/* main content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}