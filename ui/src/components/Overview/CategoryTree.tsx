import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useState } from "react";
import { useCategoryStore } from "../../store/categoryStore";
import { useTranslation } from "react-i18next";

interface CategoryTreeProps {
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryTree({ onSelectCategory }: CategoryTreeProps) {
  const categories = useCategoryStore((state) => state.categories);
  const { t } = useTranslation();

  const mainCategories = categories.filter((c) => !c.parentId);

  // Vytáhneme si IDčka hlavních kategorií
  const mainCatIds = mainCategories.map((c) => c.id);

  // V lokálním stavu teď držíme jen to, co uživatel dodatečně rozbalil
  const [userExpandedItems, setUserExpandedItems] = useState<string[]>([]);

  // "Derived state" - vypočítá se automaticky při každém renderu.
  // Zaručí, že hlavní kategorie budou VŽDY v poli rozbalených prvků.
  // Tímhle jsme se elegantně zbavili tvého "ošklivého hacku" i useEffectu!
  const expandedItems = [...new Set([...mainCatIds, ...userExpandedItems])];

  return (
    <SimpleTreeView
      multiSelect={false}
      expandedItems={expandedItems}
      onExpandedItemsChange={(_event, itemIds) => {
        // Uložíme jen to, co nám MUI pošle z kliknutí
        setUserExpandedItems(itemIds);
      }}
      onSelectedItemsChange={(_event, itemId) => {
        const catId = Array.isArray(itemId) ? itemId[0] || null : itemId;
        onSelectCategory(catId);
      }}
    >
      {mainCategories.map((mainCat) => {
        const subCategories = categories.filter(
          (c) => c.parentId === mainCat.id,
        );

        return (
          <TreeItem
            key={mainCat.id}
            itemId={mainCat.id}
            label={
              <div className="flex items-center gap-3 py-2 min-w-0">
                <div
                  className={`p-1.5 rounded-lg ${mainCat.colorClass} shrink-0`}
                >
                  <CategoryIcon name={mainCat.iconName} />
                </div>
                <span
                  className="font-semibold text-slate-700 dark:text-slate-300 truncate"
                  title={t(mainCat.label)}
                >
                  {t(mainCat.label)}
                </span>
              </div>
            }
          >
            {subCategories.map((subCat) => (
              <TreeItem
                key={subCat.id}
                itemId={subCat.id}
                label={
                  <div className="flex items-center gap-3 py-1.5 opacity-80 hover:opacity-100 min-w-0">
                    <CategoryIcon
                      name={subCat.iconName}
                      className="text-slate-600 dark:text-slate-400 shrink-0"
                    />
                    <span
                      className="font-medium text-slate-600 dark:text-slate-400 truncate"
                      title={t(subCat.label)}
                    >
                      {t(subCat.label)}
                    </span>
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
