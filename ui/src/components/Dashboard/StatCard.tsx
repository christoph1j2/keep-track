import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    amount?: number;
    budget_status?: 'GOOD' | 'BAD' | 'OK' | 'N/A';
    icon: ReactNode;
    trend?: boolean;
}

/**
 * Dashboard metric card with title, optional amount, and optional budget status.
 * Icon badge color reflects trend: green for positive, red for negative, blue for neutral.
 *
 * @param props.title Metric label.
 * @param props.amount Optional value formatted as CZK.
 * @param props.budget_status Optional budget status label.
 * @param props.icon Icon or node shown in the badge.
 * @param props.trend Trend direction that controls badge color.
 */
export function StatCard({ title, amount, budget_status, icon, trend }: StatCardProps) {
    const iconColorClass = trend === true
        ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
        : trend === false
            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';


    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            {/** horni cast */}
            <div className="flex items-center gap-3 dark:text-slate-100 transition-colors">
                <div className={`p-2 rounded-lg ${iconColorClass} transition-colors`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-300 transition-colors">
                    {title}
                </span>
            </div>

            {/** spodni cast */}
            <div 
                className="text-2xl font-bold text-slate-900 truncate dark:text-slate-400 transition-colors"
                title={amount !== undefined ? amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' }) : ''}
            >
                { // sikovny formatovni meny :-)
                    amount !== undefined ? amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' }) : ''
                }
                {budget_status && (
                    <span className={`ml-2 text-2xl font-medium ${budget_status === 'GOOD' ? 'text-green-600 dark:text-green-400' : budget_status === 'BAD' ? 'text-red-600 dark:text-red-400' : budget_status === 'N/A' ? 'text-slate-500 dark:text-slate-400' : 'text-yellow-600 dark:text-yellow-400'} transition-colors`}>
                        {budget_status}
                    </span>
                )}
            </div>

        </div>
    );
}