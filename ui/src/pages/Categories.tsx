import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { CategoryIcon } from "../components/Base/CategoryIcon";
import { useState } from "react";
import { BaseModal } from "../components/Modals/BaseModal";
import { EditCategoryModal } from "../components/Modals/EditCategoryModal";
import { AddCategoryModal } from "../components/Modals/AddCategoryModal";
import { ArrowDownward, ArrowUpward, Delete, Edit } from "@mui/icons-material";
import { UNCATEGORIZED_ID } from "../constants/categoryConstants";

/**
 * Categories management page for organizing transaction categories.
 * Allows create, update, delete, and reorder actions through drag-and-drop.
 */
export function Categories() {
    const { categories, removeCategory, updateCategory, addCategory, moveCategoryDown, moveCategoryUp } = useCategories();
    const { reassignCategory } = useTransactions();

    const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const handleDelete = (categoryId: string) => {
        const isConfirmed = window.confirm("Opravdu chcete tuto kategorii smazat? Všechny platby budou přesunuty do 'Nezařazeno'.");
        
        if (isConfirmed) {
            // Import the constant at the top of the file
            reassignCategory(categoryId, "uncategorized");
            removeCategory(categoryId);
        }
    };

    return (
        <div className="p-2 h-full flex flex-col">
            <div className="mb-6 flex flex-col items-center text-center md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Správa kategorií</h2>
                <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full md:w-fit"
                    onClick={() => setAddModalOpen(true)}
                >
                    + Nová kategorie
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Vykreslení seznamu kategorií */}
                <div className="flex flex-col">
                    {[...categories].sort((a, b) => a.order - b.order).map((cat) => (
                        <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 pl-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                {cat.id !== UNCATEGORIZED_ID && (
                                    <div className="flex flex-col w-5">
                                        <ArrowUpward 
                                            className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" 
                                            onClick={() => moveCategoryUp(cat.id)}
                                        />
                                        <ArrowDownward 
                                            className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" 
                                            onClick={() => moveCategoryDown(cat.id)}
                                        />
                                    </div>
                                )}
                                <div className={`p-2 rounded-lg ${cat.colorClass}`}>
                                    <CategoryIcon name={cat.iconName} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">{cat.label}</span>
                                    {cat.parentId && <span className="text-xs text-slate-400">Podkategorie</span>}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-3 sm:mt-0 justify-center">
                                <button
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setEditModalOpen(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                    <Edit fontSize="small" />
                                    Upravit
                                </button>
                                
                                {/* Tlačítko smazat */}
                                {cat.id !== UNCATEGORIZED_ID && ( // Nezařazeno nesmíme smazat!
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Delete fontSize="small" />
                                        Smazat
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
            <BaseModal
                title="Přidat kategorii"
                isOpen={isAddModalOpen}
                onClose={()=>setAddModalOpen(false)}
            >
                <AddCategoryModal 
                    onSubmit={(label, colorClass, iconName, order, parentId) => {
                        addCategory({
                            id: crypto.randomUUID(),
                            label,
                            colorClass,
                            iconName,
                            order,
                            parentId
                        });
                        setAddModalOpen(false);
                    }}
                    onCancel={() => setAddModalOpen(false)}
                />
            </BaseModal>

            <BaseModal
                title="Upravit kategorii"
                isOpen={isEditModalOpen}
                onClose={()=>setEditModalOpen(false)}
            >
                <EditCategoryModal
                    category={selectedCategory || null}
                    onSubmit={(label, colorClass, iconName, order, parentId) => {
                        if (!selectedCategory) return;
                        updateCategory({
                            ...selectedCategory,
                            label,
                            colorClass,
                            iconName,
                            order,
                            parentId: parentId ?? undefined,
                        });
                        setEditModalOpen(false);
                    }}
                    onCancel={() => setEditModalOpen(false)}
                />
            </BaseModal>
        </div>
        
    );
}