import { useState } from "react";
import { Select, MenuItem, TextField } from "@mui/material";
import { CategoryIcon } from "../Base/CategoryIcon";
import type { Category } from "../../types/category";
import { useCategoryStore } from "../../store/categoryStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface EditCategoryModalProps {
  category: Category | null;
  onCancel: () => void;
}

/**
 * Form used to update an existing category.
 * Pre-fills with current category values and validates that label, color, and icon are provided.
 *
 * @param props.category Category record to be edited, or null to handle edge cases.
 * @param props.onSubmit Called with the updated category fields when form is valid.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function EditCategoryModal({
  category,
  onCancel,
}: EditCategoryModalProps) {
  const { categories, updateCategory } = useCategoryStore();
  const { t } = useTranslation(); // <-- Přesunuto sem nahoru

  const categoryLabel = category?.label.startsWith("default_categories.")
    ? t(category.label)
    : category?.label;

  const [label, setLabel] = useState(categoryLabel || "");
  const [colorClass, setColorClass] = useState(category?.colorClass || "");
  const [iconName, setIconName] = useState(category?.iconName || "");
  const [parentId, setParentId] = useState<string | "">(
    category?.parentId || "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // zabrani refreshi po odesilani formulare

    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrors(null);

    // validace
    if (!label || !colorClass || !iconName) {
      setErrors([t("categories.errors.missingFields")]);
      setIsSubmitting(false);
      return;
    }
    if (parentId === category?.id) {
      setErrors([t("categories.errors.selfParent")]);
      setIsSubmitting(false);
      return;
    }

    updateCategory({
      id: category!.id,
      label: label,
      colorClass: colorClass,
      iconName: iconName,
      parentId: parentId || undefined,
    });

    setIsSubmitting(false);
    toast.success(t("categories.updated"));
    onCancel();
  };

  const MenuProps = {
    slotProps: {
      paper: {
        sx: {
          maxHeight: 200,
          overflowY: "auto",
        },
      },
    },
  };

  return (
    <>
      {errors && (
        <div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-500/10 dark:text-red-200"
          role="alert"
          aria-live="assertive"
        >
          {errors.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* nazev */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("common.name")}
          </label>
          <TextField
            fullWidth
            size="small"
            type="text"
            placeholder={t("categories.placeholder")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        {/* barva */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("common.color")}
          </label>
          <Select
            fullWidth
            value={colorClass}
            size="small"
            onChange={(e) => setColorClass(e.target.value)}
            MenuProps={MenuProps}
            renderValue={(selected) => {
              const color = colors.find((c) => c.value === selected);
              return (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: color?.hex,
                    }}
                  />
                  {color ? t(color.translationKey) : ""}
                </div>
              );
            }}
          >
            {colors.map((color) => (
              <MenuItem key={color.value} value={color.value}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: color.hex,
                    }}
                  />
                  {t(color.translationKey)}
                </div>
              </MenuItem>
            ))}
          </Select>
        </div>
        {/* ikona */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("common.icon")}
          </label>
          <Select
            fullWidth
            value={iconName}
            size="small"
            onChange={(e) => setIconName(e.target.value)}
            MenuProps={MenuProps}
          >
            {icons.map((icon) => (
              <MenuItem key={icon.value} value={icon.value}>
                <CategoryIcon name={icon.value} className="mr-1.5" />
                {t(icon.translationKey)}
              </MenuItem>
            ))}
          </Select>
        </div>
        {/* nadřazená kategorie */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("categories.parentCategory")}
          </label>
          <Select
            fullWidth
            value={parentId || ""}
            size="small"
            onChange={(e) => setParentId(e.target.value)}
            MenuProps={MenuProps}
            renderValue={(selected) => {
              if (!selected) return t("common.none");
              const parent = categories.find((c) => c.id === selected);
              return parent?.label || t("common.unknownCategory");
            }}
          >
            <MenuItem value="">{t("categories.noParent")}</MenuItem>
            {(() => {
              const rootCategories = categories.filter(
                (c) =>
                  (c.parentId === undefined || c.parentId === null) &&
                  c.id !== category?.id,
              );
              return rootCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.label}
                </MenuItem>
              ));
            })()}
          </Select>
        </div>
        {/* tlacitka */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            {t("common.save")}
          </button>
        </div>
      </form>
    </>
  );
}

// Data pole s nahrazeným `label` za `translationKey`
const colors = [
  {
    value: "bg-blue-100 text-blue-500 dark:bg-blue-600 dark:text-blue-100",
    translationKey: "categories.colors.blue",
    hex: "#3b82f6",
  },
  {
    value: "bg-green-100 text-green-500 dark:bg-green-600 dark:text-green-100",
    translationKey: "categories.colors.green",
    hex: "#22c55e",
  },
  {
    value:
      "bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100",
    translationKey: "categories.colors.yellow",
    hex: "#eab308",
  },
  {
    value: "bg-red-100 text-red-500 dark:bg-red-600 dark:text-red-100",
    translationKey: "categories.colors.red",
    hex: "#ef4444",
  },
  {
    value:
      "bg-purple-100 text-purple-500 dark:bg-purple-600 dark:text-purple-100",
    translationKey: "categories.colors.purple",
    hex: "#a855f7",
  },
  {
    value: "bg-pink-100 text-pink-500 dark:bg-pink-600 dark:text-pink-100",
    translationKey: "categories.colors.pink",
    hex: "#ec4899",
  },
  {
    value:
      "bg-indigo-100 text-indigo-500 dark:bg-indigo-600 dark:text-indigo-100",
    translationKey: "categories.colors.indigo",
    hex: "#6366f1",
  },
  {
    value: "bg-cyan-100 text-cyan-500 dark:bg-cyan-600 dark:text-cyan-100",
    translationKey: "categories.colors.cyan",
    hex: "#06b6d4",
  },
  {
    value:
      "bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100",
    translationKey: "categories.colors.emerald",
    hex: "#10b981",
  },
  {
    value:
      "bg-orange-100 text-orange-500 dark:bg-orange-600 dark:text-orange-100",
    translationKey: "categories.colors.orange",
    hex: "#f97316",
  },
  {
    value: "bg-amber-100 text-amber-500 dark:bg-amber-600 dark:text-amber-100",
    translationKey: "categories.colors.amber",
    hex: "#f59e0b",
  },
  {
    value: "bg-teal-100 text-teal-500 dark:bg-teal-600 dark:text-teal-100",
    translationKey: "categories.colors.teal",
    hex: "#14b8a6",
  },
  {
    value: "bg-lime-100 text-lime-500 dark:bg-lime-600 dark:text-lime-100",
    translationKey: "categories.colors.lime",
    hex: "#84cc16",
  },
  {
    value: "bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-100",
    translationKey: "categories.colors.slate",
    hex: "#64748b",
  },
];

const icons = [
  { value: "AttachMoney", translationKey: "categories.icons.money" },
  { value: "DirectionsTransit", translationKey: "categories.icons.transit" },
  { value: "LocalCafe", translationKey: "categories.icons.cafe" },
  { value: "Movie", translationKey: "categories.icons.entertainment" },
  { value: "QuestionMark", translationKey: "categories.icons.uncategorized" },
  { value: "ShoppingCart", translationKey: "categories.icons.groceries" },
  { value: "ShoppingBag", translationKey: "categories.icons.shopping" },
  { value: "Home", translationKey: "categories.icons.home" },
  { value: "FitnessCenter", translationKey: "categories.icons.fitness" },
  { value: "LocalHospital", translationKey: "categories.icons.health" },
  { value: "ElectricBolt", translationKey: "categories.icons.energy" },
  { value: "Water", translationKey: "categories.icons.water" },
  { value: "LocalGasStation", translationKey: "categories.icons.fuel" },
  { value: "Flight", translationKey: "categories.icons.travel" },
  { value: "Hotel", translationKey: "categories.icons.accommodation" },
  { value: "MenuBook", translationKey: "categories.icons.education" },
  { value: "Work", translationKey: "categories.icons.work" },
  { value: "GamepadRounded", translationKey: "categories.icons.gaming" },
  { value: "MoreHoriz", translationKey: "categories.icons.other" },
];
