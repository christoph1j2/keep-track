/**
 * Core category record used across the app for organizing and filtering transactions.
 * Supports optional nesting via parentId for hierarchical category trees.
 *
 * @property {string} id Unique category identifier.
 * @property {string} label Human-readable category name displayed in UI.
 * @property {string} iconName MUI icon component name (e.g., "LocalCafe", "ElectricBolt", "DirectionsTransit") mapped in CategoryIcon component.
 * @property {string} colorClass Tailwind CSS classes for styling (e.g., "bg-orange-100 text-orange-600") applied to category badges.
 * @property {string} [parentId] Optional reference to parent category id for subcategory nesting in TreeView; omitted for root categories.
 */
export interface Category {
    id: string;
    label: string;
    iconName: string;
    colorClass: string;
    parentId?: string;
}