/**
 * Interface for the LLM provider used to categorize transactions.
 */
export interface LlmProvider {
  categorise(
    titles: string[],
    categories: { id: string; label: string }[],
  ): Promise<{ title: string; categoryId: string | null }[]>;
}

/**
 * Symbol used to inject the LLM provider into services that require it.
 */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
