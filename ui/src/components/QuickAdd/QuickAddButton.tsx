import type { ReactNode, ReactElement } from "react";
import { cloneElement, isValidElement } from "react";
import type { SxProps } from "@mui/system";

interface QuickAddButtonProps {
    title: string;
    amount?: number;
    icon: ReactNode;
    colorClass: string;
    onClick: () => void;
}

/**
 * Shortcut button for quick transaction creation.
 * Enlarges MUI icons to improve scanning speed; displays title and optional amount below icon badge.
 *
 * @param props.title Button label shown below icon.
 * @param props.amount Optional amount displayed below title (formatted as CZK).
 * @param props.icon Icon or React node shown above label; MUI icons are enlarged to 32px.
 * @param props.colorClass Tailwind classes for icon badge background/text (e.g., "bg-orange-100 text-orange-600").
 * @param props.onClick Callback fired when button is clicked.
 */
export function QuickAddButton({ title, amount, icon, colorClass, onClick }: QuickAddButtonProps) {

    // zvetsi ikonu, pokud je to platny React element (napr. MUI ikona)
    const largeIcon = isValidElement(icon) 
        ? cloneElement(icon as ReactElement<{ sx?: SxProps }>, { 
            sx: { fontSize: 32 } 
        })
        : icon;

    return (
        <button
            onClick={onClick}
            className="flex items-center flex-col"
        >
            <div className={`cursor-pointer p-2 rounded-lg mb-1 ${colorClass}`}>
                {largeIcon}
            </div>
            <span className="font-bold">
                {title}
            </span>
            {amount !== undefined && (
                <span className="font-semibold">{amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</span>
            )}
        </button>
    )

}