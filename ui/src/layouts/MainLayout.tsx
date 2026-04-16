
export function MainLayout({ children }: { children: ReactNode }) {

    return (
        <div className="flex h-screen bg-slate-50">
            {/* side panel */}
            <aside className="w-64 bg-white border-r border-slate-200 p-4">
                <h1 className="text-2xl font-bold text-slate-900">
                    Keep<span className="text-blue-600">Track</span>
                </h1>

                <div className="mt-8">
                    <p className="text-slate-500 text-sm">placeholder menu</p>
                </div>
            </aside>

            <div>
                {/* top bar */}
                <div className="h-16 bg-white border-b border-slate-200 p-3 pl-6">
                    <div>
                        <p className="font-semibold">Ernst Christoph Leschka</p>
                        <p className="text-sm text-slate-500">Osobní číslo: A25B0266P</p>
                    </div>
                </div>
                {/* main content */}
                <main className="flex-1 p-8">

                    {children}

                </main>
            </div>

        </div>
    )
}