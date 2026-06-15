import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragIndicator, Delete, Edit } from "@mui/icons-material";
import { CategoryIcon } from "../Base/CategoryIcon";
import type { Budget } from "../../types/budget";
import { ProgressBar } from "./ProgressBar";
import { useCategoryStore } from "../../store/categoryStore";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../store/confirmStore";

interface SortableBudgetItemProps {
    budget: Budget;
    spent: number;
    onProgressBarClick: (categoryId: string) => void;
    onEdit: (budget: Budget) => void;
    onDelete: (categoryId: string) => void;
}

export function SortableBudgetItem({ 
    budget, 
    spent, 
    onProgressBarClick,
    onEdit, 
    onDelete
}: SortableBudgetItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: budget.categoryId });
    const categories = useCategoryStore((state) => state.categories);

    const { t } = useTranslation();
    const showConfirm = useConfirmStore((state) => state.showConfirm);

    const category = categories.find((c) => c.id === budget.categoryId);
    if (!category) return null;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="inline-flex items-center gap-3 rounded-lg border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-700 p-4 shadow-sm sm:gap-4 sm:p-6 w-full select-none"
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
                aria-label={t('budgeting.moveBudget')}
            >
                <DragIndicator fontSize="small" />
            </button>

            <div className="flex-1" onClick={() => onProgressBarClick(budget.categoryId)}>
                <ProgressBar
                    categoryName={category.label}
                    categoryIcon={<CategoryIcon name={category.iconName} className="text-slate-500 dark:text-slate-300" />}
                    progress={spent}
                    limit={budget.limit}
                />
            </div>
            
            <div className="flex flex-col gap-2 ml-auto">
                <button
                    type="button"
                    onClick={() => onEdit(budget)}
                    className="shrink-0 rounded-md px-1 font-semibold text-slate-600 dark:text-slate-400 dark:hover:bg-slate-600 transition-colors hover:bg-slate-50 inline-flex items-center gap-1">
                    <Edit fontSize="medium" />
                    {t('common.edit')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        showConfirm(
                            t('common.warning'),
                            t('budgeting.deleteConfirm', { category: category.label }),
                            () => onDelete(budget.categoryId)
                        );
                    }}
                    className="shrink-0 rounded-md px-1 font-semibold text-red-600 dark:text-red-500 dark:hover:bg-slate-600 transition-colors hover:bg-red-50 inline-flex items-center gap-1"
                >
                    <Delete fontSize="medium" />
                    {t('common.delete')}
                </button>
            </div>
        </div>
    );
}