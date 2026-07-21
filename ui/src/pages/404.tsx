/**
 * Fallback page shown when no route matches the requested path.
 */
export function NotFound() {
    return (
        <div className="p-2">
            <h2 className="text-3xl font-bold text-slate-800 mb-4 dark:text-slate-200">404 - Nenalezeno</h2>
            <p className="text-slate-600 dark:text-slate-400">Omlouváme se, ale stránka, kterou hledáte, nebyla nalezena.</p>
        </div>
    );
}