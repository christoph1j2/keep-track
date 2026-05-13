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
 * Maps icon keys to MUI icon components.
 * Keeping this registry in one place makes category rendering consistent across views.
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
 * Renders a category icon by key and falls back to a question mark icon when unknown.
 *
 * @param props.name Icon key expected in the registry.
 * @param props.className Optional class names for color and spacing customization.
 * @returns Matching icon component, or a fallback icon when the key is missing.
 */
export function CategoryIcon({ name, className }: { name: string, className?: string }) {
    const IconComponent = ICON_MAP[name] || QuestionMark;
    return <IconComponent className={className} fontSize="small" />;
}