import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragIndicator, Delete, Edit } from "@mui/icons-material";
import { CategoryIcon } from "../Base/CategoryIcon";
import type { Category } from "../../types/category";
import { UNCATEGORIZED_ID } from "../../constants/categoryConstants";
import { useTranslation } from "react-i18next";

interface SortableCategoryItemProps {
    cat: Category;
    onEdit: (category: Category) => void;
    onDelete: (categoryId: string) => void;
}

export function SortableCategoryItem({ 
    cat, 
    onEdit, 
    onDelete
}: SortableCategoryItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const { t } = useTranslation();

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 pl-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors bg-white dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-700 w-full"
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        style={{ touchAction: 'none' }}
                        className="cursor-grab active:cursor-grabbing p-1 px-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
                        aria-label="Přesunout kategorii"
                    >
                        <DragIndicator fontSize="small" />
                    </button>

                <div className={`p-2 rounded-lg ${cat.colorClass} shrink-0`}>
                    <CategoryIcon name={cat.iconName} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-700 dark:text-slate-300 dark:truncate" title={cat.label}>{cat.label}</span>
                    {cat.parentId && <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.subcategory")}</span>}
                </div>
            </div>

            <div className="flex gap-2 mt-3 sm:mt-0 justify-center shrink-0">
                {cat.id !== UNCATEGORIZED_ID && (
                <>
                <button
                    onClick={() => onEdit(cat)}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-slate-400 rounded-md transition-colors"
                >
                    <Edit fontSize="small" />
                    {t("common.edit")}
                </button>
                
                    <button 
                        onClick={() => onDelete(cat.id)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 dark:text-red-500 rounded-md transition-colors"
                    >
                        <Delete fontSize="small" />
                        {t("common.delete")}
                    </button>
                </>
                )}
            </div>
        </div>
    );
}
