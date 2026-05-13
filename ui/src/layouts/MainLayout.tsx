import type { ReactNode } from 'react';
import { Sidebar } from '../components/Base/Sidebar';
import { Topbar } from '../components/Base/Topbar';

/**
 * Shared app shell with sidebar navigation, top bar, and page content area.
 * The layout keeps navigation stable while allowing the main section to scroll.
 *
 * @param props.children Active page content.
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