/**
 * Application header bar showing the current user's name and personal identifier.
 * Displays hardcoded user info (Ernst Christoph Leschka); future versions may load from auth context.
 */
export function Topbar() {
    return (
        <header className="h-16 bg-white border-b border-slate-200 p-3 pl-6">
            <div>
                <p className="font-semibold">Ernst Christoph Leschka</p>
                <p className="text-sm text-slate-500">Osobní číslo: A25B0266P</p>
            </div>
        </header>
    )
}