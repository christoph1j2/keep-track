import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    amount?: number;
    budget_status?: 'GOOD' | 'BAD' | 'OK';
    icon: ReactNode;
    trend?: boolean;
}

export function StatCard({ title, amount, budget_status, icon, trend }: StatCardProps) {
    const iconColorClass = trend === true
        ? 'bg-green-100 text-green-600'
        : trend === false
            ? 'bg-red-100 text-red-600'
            : 'bg-blue-100 text-blue-600';

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            {/** horni cast */}
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconColorClass}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-500">
                    {title}
                </span>
            </div>

            {/** spodni cast */}
            <div className="text-2xl font-bold text-slate-900">
                { // sikovny formatovni meny :-)
                    amount !== undefined ? amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' }) : ''
                }
                {budget_status && (
                    <span className={`ml-2 text-2xl font-medium ${budget_status === 'GOOD' ? 'text-green-600' : budget_status === 'BAD' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {budget_status}
                    </span>
                )}
            </div>

        </div>
    );
}