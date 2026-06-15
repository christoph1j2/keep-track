import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { CategoryIcon } from "../Base/CategoryIcon";
import React from 'react';
import { useCategoryStore } from '../../store/categoryStore';

interface CategoryTreeProps {
    onSelectCategory: (categoryId: string | null) => void,
}

/**
 * Renders a two-level category tree with persistent root expansion.
 * Root categories stay expanded so users can always access subcategories quickly.
 *
 * @param props.categories Category list containing roots and optional children.
 * @param props.onSelectCategory Callback that receives the selected category id, or null.
 */
export function CategoryTree({onSelectCategory}: CategoryTreeProps) {
    const categories = useCategoryStore((state) => (state.categories));

    const mainCategories = categories.filter(c => c.parentId === undefined);

    const [expandedItems, setExpandedItems] = React.useState<string[]>(
        mainCategories.map(c => c.id)
    );

    return (
        <SimpleTreeView
            multiSelect={false}
            expandedItems={expandedItems}
            onExpandedItemsChange={
                (_event, itemIds) => {
                    const mainCatIds = mainCategories.map(c => c.id);
                    const expanded = itemIds || [];

                    setExpandedItems([...new Set([...mainCatIds, ...expanded])]) // zajistime, ze hlavni kategorie jsou vzdy expanded, i kdyz uzivatel klikne na expand/collapse (osklivej hack, ale co uz :( )
                }
            }
            onSelectedItemsChange={
                (_event, itemId) => {
                    const catId = Array.isArray(itemId) ? itemId[0] || null : itemId; // fix pro overwrite pro prvni klik
                    onSelectCategory(catId) // zavolame callback s id kategorie, kterou uzivatel kliknul
                }
            }
        >
            {mainCategories.map((mainCat) => {
                const subCategories = categories.filter(c => c.parentId === mainCat.id);

                return (
                    <TreeItem
                        key={mainCat.id}
                        itemId={mainCat.id}
                        
                        label={ //! fix overflow, pridani tooltipu
                            <div 
                                className='flex items-center gap-3 py-2 min-w-0'
                            >
                                <div className={`p-1.5 rounded-lg ${mainCat.colorClass} shrink-0`}>
                                    <CategoryIcon name={mainCat.iconName} />
                                </div>
                                <span className='font-semibold text-slate-700 dark:text-slate-300 truncate' title={mainCat.label}>{mainCat.label}</span>
                            </div>
                        }
                    >
                        {subCategories.map((subCat) => (
                            <TreeItem
                                key={subCat.id}
                                itemId={subCat.id}
                                label={
                                    <div 
                                        className="flex items-center gap-3 py-1.5 opacity-80 hover:opacity-100 min-w-0"
                                    >
                                        <CategoryIcon name={subCat.iconName} className="text-slate-600 dark:text-slate-400 shrink-0" />
                                        <span className="font-medium text-slate-600 dark:text-slate-400 truncate" title={subCat.label}>{subCat.label}</span>
                                    </div>
                                }
                            />
                        ))}
                    </TreeItem>
                );
            })}

        </SimpleTreeView>
    );
}