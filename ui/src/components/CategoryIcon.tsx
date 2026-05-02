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

export function CategoryIcon({ name, className }: { name: string, className?: string }) {
    const IconComponent = ICON_MAP[name] || QuestionMark;
    return <IconComponent className={className} fontSize="small" />;
}