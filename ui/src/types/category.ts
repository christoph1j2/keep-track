/**
 * Core category record used across the app.
 * parentId stays optional so categories can be nested later without changing the shape.
 */
export interface Category {
    id: string;
    label: string;
    iconName: string; // nazev ikony z MUI, napr "ElectricBold" ...
    colorClass: string; // napriklad "bg-red-100 text-red-600"
    parentId?: string; // pro podkategorie, odkaz na rodicovskou kategorii ... TreeView
}