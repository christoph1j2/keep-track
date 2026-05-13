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
 * Compact button used in the quick-add row on the dashboard.
 * If the icon is a React element, it is cloned with a larger size for easier scanning.
 *
 * @param props.title Label shown under the icon.
 * @param props.amount Optional amount shown under the title in CZK.
 * @param props.icon Icon node rendered in the badge.
 * @param props.colorClass Tailwind classes for icon badge styling.
 * @param props.onClick Action executed when the user presses the button.
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