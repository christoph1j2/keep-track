import * as Icons from "@mui/icons-material";
import type { ElementType } from "react";

export function CategoryIcon({ name, className }: { name: string, className?: string }) {
    const IconComponent = (Icons as unknown as Record<string, ElementType>)[name] || Icons.QuestionMark;
    return <IconComponent className={className} fontSize="small" />;
}