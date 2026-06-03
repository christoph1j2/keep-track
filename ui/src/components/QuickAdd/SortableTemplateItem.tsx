import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type QuickAddTemplate } from "../../types/quickadd";
import { QuickAddButton } from "./QuickAddButton";
import { useCategories } from "../../hooks/useCategories";
import { CategoryIcon } from "../Base/CategoryIcon";
import { Delete, DragIndicator, Edit, PushPin, PushPinOutlined } from "@mui/icons-material";

interface SortableTemplateItemProps {
    template: QuickAddTemplate;
    compact?: boolean;
    onEdit?: (template: QuickAddTemplate) => void;
    onDelete?: (template: QuickAddTemplate) => void;
    onToggleHotbar?: (template: QuickAddTemplate) => void;
}

/**
 * Draggable quick add template item that integrates with dnd-kit for drag-and-drop reordering.
 * Displays the template with optional edit, delete, and hotbar toggle actions.
 *
 * @param props.template Template record to display.
 * @param props.compact When true, renders in a compact list style; otherwise uses full button style.
 * @param props.onEdit Called when user clicks the edit button.
 * @param props.onDelete Called when user clicks the delete button.
 * @param props.onToggleHotbar Called when user clicks the pin/unpin button.
 */
export function SortableTemplateItem({
    template,
    compact = false,
    onEdit,
    onDelete,
    onToggleHotbar,
}: SortableTemplateItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template.id });
    const { categories } = useCategories();

    const category = categories.find(c => c.id === template.categoryId);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const icon = category ? <CategoryIcon name={category.iconName} /> : <CategoryIcon name="QuestionMark" />;

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`select-none ${compact ? "relative shrink-0" : "bg-white border border-slate-100 rounded-2xl shadow-sm"}`}>
            {compact ? (
                <div className="relative p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        style={{ touchAction: 'none' }}
                        className="absolute top-1 left-1 cursor-grab p-1 text-slate-400 hover:text-slate-600 z-30 touch-none"
                        aria-label="Přesunout šablonu"
                    >
                        <DragIndicator fontSize="small" />
                    </button>
                    <div className="pt-4 px-3">
                        <QuickAddButton
                            title={template.title}
                            amount={template.amount}
                            icon={icon}
                            colorClass={category?.colorClass || "bg-gray-200 text-gray-800"}
                            onClick={() => onEdit?.(template)}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            type="button"
                            {...attributes}
                            {...listeners}
                            style={{ touchAction: 'none' }}
                            className="cursor-grab p-1 text-slate-400 hover:text-slate-600"
                            aria-label="Přesunout šablonu"
                        >
                            <DragIndicator />
                        </button>
                        <div className={`p-2 rounded-lg ${category?.colorClass || "bg-gray-200 text-gray-800"}`}>
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate">{template.title}</div>
                            <div className="text-sm text-slate-500">
                                {template.amount.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}
                                {category ? ` · ${category.label}` : ""}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => onToggleHotbar?.(template)}
                            className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                template.showInHotbar
                                    ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {template.showInHotbar ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                            Hotbar
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit?.(template)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <Edit fontSize="small" />
                            Upravit
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete?.(template)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Delete fontSize="small" />
                            Smazat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
