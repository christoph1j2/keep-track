import {
    AttachMoney,
    DirectionsTransit,
    LocalCafe,
    Movie,
    QuestionMark,
    ShoppingCart,
    ShoppingBag,
    Home,
    FitnessCenter,
    LocalHospital,
    ElectricBolt,
    Water,
    LocalGasStation,
    Flight,
    Hotel,
    MenuBook,
    Work,
    GamepadRounded,
    MoreHoriz,
} from "@mui/icons-material";
import type { ElementType } from "react";

/**
 * Maps category icon names (MUI icon component names) to actual icon components.
 * Provides a centralized registry for category icon rendering across the app.
 */
const ICON_MAP: Record<string, ElementType> = {
    // Current categories
    AttachMoney,
    DirectionsTransit,
    LocalCafe,
    Movie,
    // Shopping & Retail
    ShoppingCart,
    ShoppingBag,
    // Home & Living
    Home,
    // Health & Fitness
    FitnessCenter,
    LocalHospital,
    // Utilities
    ElectricBolt,
    Water,
    LocalGasStation,
    // Travel
    Flight,
    Hotel,
    // Education
    MenuBook,
    // Work
    Work,
    // Entertainment
    GamepadRounded,
    // General
    MoreHoriz,
};

/**
 * Renders an icon from the category registry or falls back to a question mark icon.
 * Used in category badges, trees, and transaction lists throughout the app.
 *
 * @param props.name MUI icon name (e.g., "LocalCafe", "DirectionsTransit") registered in ICON_MAP.
 * @param props.className Optional CSS class for icon styling (size, color overrides, etc.).
 * @returns Icon component or QuestionMark if name is not found in registry.
 */
export function CategoryIcon({ name, className }: { name: string, className?: string }) {
    const IconComponent = ICON_MAP[name] || QuestionMark;
    return <IconComponent className={className} fontSize="small" />;
}