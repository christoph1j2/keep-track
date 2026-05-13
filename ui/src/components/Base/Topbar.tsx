/**
 * Simple application header that currently shows the signed-in user's name and personal id.
 * The content is static for now, but the component is small on purpose so it can later pull from auth or user context.
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