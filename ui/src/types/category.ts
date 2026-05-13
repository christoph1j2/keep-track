/**
 * Category record used to group transactions and render category visuals.
 * Optional parentId enables a two-level hierarchy in the overview tree.
 *
 * @property {string} id Unique category identifier.
 * @property {string} label Display name shown to users.
 * @property {string} iconName Icon key resolved by the category icon registry.
 * @property {string} colorClass Tailwind classes used for category badge colors.
 * @property {string} [parentId] Parent category id when this category is a subcategory.
 */
export interface Category {
    id: string;
    label: string;
    iconName: string;
    colorClass: string;
    parentId?: string;
}