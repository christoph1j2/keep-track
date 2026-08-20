// LLM Provider interface for categorizing transactions
export interface LlmProvider {
    categorise(
        titles: string[],
        categories: { id: string; label: string }[],
    ): Promise<{ title: string; categoryId: string | null }[]>;
}

// Symbol for dependency injection of the LLM provider
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');