/**
 * Template for quickly creating transactions with predefined values.
 * Used to speed up data entry for frequently repeated transactions.
 *
 * @property id - Unique identifier for this template.
 * @property title - Default transaction title/description.
 * @property amount - Default transaction amount in CZK (negative = expense, positive = income).
 * @property categoryId - Default category for transactions created from this template.
 * @property showInHotbar - Whether this template appears in the quick-add hotbar for easy access.
 */
export interface QuickAddTemplate {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    showInHotbar: boolean;
}
