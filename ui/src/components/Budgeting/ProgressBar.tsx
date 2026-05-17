import type { ReactNode } from "react";

interface ProgressBarProps {
    categoryName: string; // e.g. "Food", "Transport"
    categoryIcon?: ReactNode; // optional icon for the category
    progress: number; // how much is spent in CZK, will be converted to percentage based on the limit
    limit: number; // budget limit in CZK
}

/**
 * Visual budget progress bar showing spending vs. limit for a single category.
 * Color changes based on percentage: green (0-75%), yellow (75-95%), red (95%+).
 * Exceeding the limit caps the bar at 100% but displays the full spent amount.
 *
 * @param props.categoryName Display name for the budget category.
 * @param props.categoryIcon Optional icon component or node rendered next to the category name.
 * @param props.progress Amount spent so far in CZK.
 * @param props.limit Budget limit in CZK.
 */
export function ProgressBar({ categoryName, categoryIcon, progress, limit }: ProgressBarProps) {
    const percentage = limit > 0 ? (progress / limit) * 100 : 0;
    const isExceeded = percentage > 100;

    const progressColorClass = percentage < 75
        ? 'bg-green-500'
        : percentage < 95
            ? 'bg-yellow-500'
            : 'bg-red-500';

    const displayPercentage = Math.min(percentage, 100);
    const formattedProgress = progress.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });
    const formattedLimit = limit.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });

    return (
        <div className="w-full min-w-0">
            {/* Header: Category name, icon, and amount */}
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-2">
                    {categoryIcon && <span className="shrink-0 text-xl">{categoryIcon}</span>}
                    <span className="min-w-0 truncate font-semibold text-gray-800">{categoryName}</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1 text-sm font-medium sm:shrink-0 sm:justify-end sm:text-right">
                    <span className={isExceeded ? 'text-red-600' : 'text-gray-600'}>
                        {formattedProgress}
                    </span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-600">{formattedLimit}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`${progressColorClass} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${displayPercentage}%` }}
                />
            </div>

            {/* Warning message if exceeded */}
            {isExceeded && (
                <div className="mt-1 text-xs text-red-600 font-semibold">
                    ⚠️ Rozpočet překročen o {(progress - limit).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}
                </div>
            )}
        </div>
    );
}
