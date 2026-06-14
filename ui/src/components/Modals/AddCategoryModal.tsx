import { useState } from "react";
import { Select, MenuItem, TextField } from "@mui/material";
import { CategoryIcon } from "../Base/CategoryIcon";
import { UNCATEGORIZED_ID } from "../../constants/categoryConstants";
import { useCategoryStore } from "../../store/categoryStore";

interface AddCategoryModalProps {
    onCancel: () => void;
}

/**
 * Form used to create a new transaction category.
 * Validates that label, color, and icon are selected.
 * Automatically assigns the next order value based on existing categories.
 *
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function AddCategoryModal({ onCancel }: AddCategoryModalProps) {
    const { categories, addCategory } = useCategoryStore();

    const [label, setLabel] = useState("");
    const [colorClass, setColorClass] = useState("bg-gray-500");
    const [iconName, setIconName] = useState("question_mark");
    const [parentId, setParentId] = useState<string | "">("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[] | null>(null);


    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault(); // zabrani refreshi po odesilani

        if (isSubmitting) return; // zabrani dvojitemu odesilani
        setIsSubmitting(true);
        setErrors(null);

        // validace
        if (!label || !colorClass || !iconName) {
            setErrors(["Vyplňte všechny pole"]);
            setIsSubmitting(false);
            return;
        }

        addCategory({
            label: label,
            colorClass: colorClass,
            iconName: iconName,
            parentId: parentId || undefined,
        });

        setIsSubmitting(false);
        onCancel();
    }

    const MenuProps = {
        slotProps: {
            paper: {
                sx: {
                    maxHeight: 200,
                    overflowY: 'auto',
                },
            },
        },
    };

    return (
        <>
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="assertive">
                {errors.map((err, idx) => (
                    <p key={idx}>{err}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* nazev */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Název</label>
                <TextField
                    fullWidth
                    size="small"
                    type="text"
                    placeholder="Např. Doprava"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                />
            </div>
            {/* barva */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Barva</label>
                <Select
                    fullWidth
                    value={colorClass}
                    size="small"
                    onChange={(e) => setColorClass(e.target.value)}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                        const color = colors.find(c => c.value === selected);
                        return (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div 
                                    style={{ 
                                        width: "16px", 
                                        height: "16px", 
                                        borderRadius: "50%",
                                        backgroundColor: color?.hex 
                                    }} 
                                />
                                {color?.label}
                            </div>
                        );
                    }}
                >
                    {colors.map(color => (
                        <MenuItem 
                            key={color.value} 
                            value={color.value}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div 
                                    style={{ 
                                        width: "16px", 
                                        height: "16px", 
                                        borderRadius: "50%",
                                        backgroundColor: color.hex 
                                    }} 
                                />
                                {color.label}
                            </div>
                        </MenuItem>
                    ))}
                </Select>
            </div>
            {/* ikona */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Ikona</label>
                <Select
                    fullWidth
                    value={iconName}
                    size="small"
                    onChange={(e) => setIconName(e.target.value)}
                    MenuProps={MenuProps}
                >
                    {icons.map(icon => (
                        <MenuItem key={icon.value} value={icon.value}>
                            <CategoryIcon name={icon.value} className="mr-1.5"/>
                            {icon.label}
                        </MenuItem>
                    ))}
                </Select>
            </div>
            {/* nadřazená kategorie */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Nadřazená kategorie</label>
                <Select
                    fullWidth
                    value={parentId || ""}
                    size="small"
                    onChange={(e) => setParentId(e.target.value)}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                        if (!selected) return "Žádná";
                        const parent = categories.find(c => c.id === selected);
                        return parent?.label || "Neznámá";
                    }}
                >
                    <MenuItem value="">Žádná</MenuItem>
                    {(() => {
                        //console.log("All categories:", categories);
                        const rootCategories = categories.filter(c => (c.parentId === undefined || c.parentId === null)); // Jen kategorie bez rodiče
                        //console.log("Root categories:", rootCategories);
                        return rootCategories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.label}
                            </MenuItem>
                        ));
                    })()}
                </Select>
            </div>
            {/* tlacitka */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                Zrušit
                </button>
                <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                    Uložit kategorii
                </button>
            </div>
        </form>
        </>
    )
}

const colors = [
    { value: "bg-blue-100 text-blue-500", label: "Modrá", hex: "#3b82f6" },
    { value: "bg-green-100 text-green-500", label: "Zelená", hex: "#22c55e" },
    { value: "bg-yellow-100 text-yellow-500", label: "Žlutá", hex: "#eab308" },
    { value: "bg-red-100 text-red-500", label: "Červená", hex: "#ef4444" },
    { value: "bg-purple-100 text-purple-500", label: "Fialová", hex: "#a855f7" },
    { value: "bg-pink-100 text-pink-500", label: "Růžová", hex: "#ec4899" },
    { value: "bg-indigo-100 text-indigo-500", label: "Indigo", hex: "#6366f1" },
    { value: "bg-cyan-100 text-cyan-500", label: "Azurová", hex: "#06b6d4" },
    { value: "bg-emerald-100 text-emerald-500", label: "Smaragd", hex: "#10b981" },
    { value: "bg-orange-100 text-orange-500", label: "Oranžová", hex: "#f97316" },
    { value: "bg-amber-100 text-amber-500", label: "Jantarová", hex: "#f59e0b" },
    { value: "bg-teal-100 text-teal-500", label: "Modrozelená", hex: "#14b8a6" },
    { value: "bg-lime-100 text-lime-500", label: "Limetková", hex: "#84cc16" },
    { value: "bg-slate-100 text-slate-500", label: "Šedá", hex: "#64748b" },
];

const icons = [
    {value: "AttachMoney", label: "Peníze"},
    {value: "DirectionsTransit", label: "Doprava"},
    {value: "LocalCafe", label: "Kavárna"},
    {value: "Movie", label: "Zábava"},
    {value: "QuestionMark", label: "Nezařazeno"},
    {value: "ShoppingCart", label: "Potraviny"},
    {value: "ShoppingBag", label: "Nákupy"},
    {value: "Home", label: "Domov"},
    {value: "FitnessCenter", label: "Fitness"},
    {value: "LocalHospital", label: "Zdraví"},
    {value: "ElectricBolt", label: "Energie"},
    {value: "Water", label: "Voda"},
    {value: "LocalGasStation", label: "Pohonné hmoty"},
    {value: "Flight", label: "Cestování"},
    {value: "Hotel", label: "Ubytování"},
    {value: "MenuBook", label: "Vzdělání"},
    {value: "Work", label: "Práce"},
    {value: "GamepadRounded", label: "Hry"},
    {value: "MoreHoriz", label: "Jiné"},
]
