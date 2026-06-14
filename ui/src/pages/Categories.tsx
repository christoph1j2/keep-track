import { useState } from "react";
import { BaseModal } from "../components/Modals/BaseModal";
import { EditCategoryModal } from "../components/Modals/EditCategoryModal";
import { AddCategoryModal } from "../components/Modals/AddCategoryModal";
import { useCategoryStore } from "../store/categoryStore";
import { useTransactionStore } from "../store/transactionStore";
import { SortableCategoryItem } from "../components/Categories/SortableCategoryItem";
import {
    DndContext,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

/**
 * Categories management page for organizing transaction categories.
 * Allows create, update, delete, and reorder actions through drag-and-drop.
 */
export function Categories() {
    const { categories, removeCategory, reorderCategories } = useCategoryStore();
    const { reassignCategory } = useTransactionStore();

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((cat) => cat.id === active.id);
            const newIndex = categories.findIndex((cat) => cat.id === over.id);

            reorderCategories(arrayMove(categories, oldIndex, newIndex));
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
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col">
                            {categories.map((cat) => (
                                <SortableCategoryItem 
                                    key={cat.id} 
                                    cat={cat} 
                                    onEdit={() => {
                                        setSelectedCategory(cat);
                                        setEditModalOpen(true);
                                    }}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            <BaseModal
                title="Přidat kategorii"
                isOpen={isAddModalOpen}
                onClose={()=>setAddModalOpen(false)}
            >
                <AddCategoryModal 
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
                    onCancel={() => setEditModalOpen(false)}
                />
            </BaseModal>
        </div>
        
    );
}