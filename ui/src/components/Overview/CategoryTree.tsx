import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import type { Category } from "../../types/category";
import { CategoryIcon } from "../Base/CategoryIcon";

interface CategoryTreeProps {
    categories: Category[],
    onSelectCategory: (categoryId: string) => void, // callback pro výběr kategorie
}

export function CategoryTree({categories, onSelectCategory}: CategoryTreeProps) {
    const mainCategories = categories.filter(c => c.parentId === undefined);

    return (
        <SimpleTreeView
            onSelectedItemsChange={
                (event, itemId) => itemId !== null ? onSelectCategory(itemId) : undefined
            }
        >
            {mainCategories.map((mainCat) => {
                const subCategories = categories.filter(c => c.parentId === mainCat.id);

                return (
                    <TreeItem
                        key={mainCat.id}
                        itemId={mainCat.id}
                        label={
                            <div className='flex items-center gap-3 py-2'>
                                <div className={`p-1.5 rounded-lg ${mainCat.colorClass}`}>
                                    <CategoryIcon name={mainCat.iconName} />
                                </div>
                                <span className='font-semibold text-slate-700'>{mainCat.label}</span>
                            </div>
                        }
                    >
                        {subCategories.map((subCat) => (
                            <TreeItem
                                key={subCat.id}
                                itemId={subCat.id}
                                label={
                                    <div className="flex items-center gap-3 py-1.5 opacity-80 hover:opacity-100">
                                        <CategoryIcon name={subCat.iconName} className="text-slate-400" />
                                        <span className="font-medium text-slate-600">{subCat.label}</span>
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