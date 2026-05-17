import { MobileMenu } from './MobileMenu';

/**
 * Application header with user info and mobile hamburger menu.
 * Shows user details on all screens, hamburger menu only on mobile.
 */
export function Topbar() {
    return (
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
        </header>
    )
}