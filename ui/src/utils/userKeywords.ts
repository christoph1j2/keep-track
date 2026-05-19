/**
 * User-learned keywords for category guessing during bank import.
 * Stores mappings from extracted keywords to category IDs in localStorage.
 */

const USER_KEYWORDS_STORAGE_KEY = "keep-track-user-keywords";

export interface UserKeywordEntry {
    keyword: string;
    categoryId: string;
    learnedAt: number; // timestamp pro budoucí features (nejstarší keyword, nejčastější atd.)
}

/**
 * Extracts a keyword from a transaction title.
 * Takes the first word, normalizes it (lowercase, removes non-alphanumeric),
 * and returns it only if it's at least 3 characters long.
 * 
 * @param title Transaction title (e.g., "TESCO PLZEN LOCHOTIN")
 * @returns Extracted keyword (e.g., "tesco") or null if too short
 * 
 * @example
 * extractKeyword("TESCO PLZEN LOCHOTIN") // "tesco"
 * extractKeyword("McDonald's Burger") // "mcdonalds"
 * extractKeyword("A.B.C. Store") // "abc"
 * extractKeyword("v prodejně") // null (dvě slova, druhé by bylo "prodejne" - 8 znaků, ale berem první "v" - 1 znak)
 */
export function extractKeyword(title: string): string | null {
    const trimmed = title.toLowerCase().trim();
    if (!trimmed) return null;

    // Vezmi první slovo
    const firstWord = trimmed.split(/\s+/)[0];
    
    // Odeber speciální znaky, zachej jen alfanumeriku
    const normalized = firstWord.replace(/[^a-z0-9]/g, '');
    
    // Minimální délka 3 znaky
    return normalized.length >= 3 ? normalized : null;
}

/**
 * Loads all user-learned keywords from localStorage.
 * Returns empty array if storage is unavailable or invalid.
 * 
 * @returns Array of user keyword entries
 */
export function loadUserKeywords(): UserKeywordEntry[] {
    if (typeof window === "undefined") return [];
    
    try {
        const stored = localStorage.getItem(USER_KEYWORDS_STORAGE_KEY);
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Error loading user keywords:", error);
        return [];
    }
}

/**
 * Saves a user-learned keyword mapping to localStorage.
 * Overwrites existing mapping if keyword already exists.
 * Does nothing if keyword cannot be extracted.
 * 
 * @param title Transaction title to extract keyword from
 * @param categoryId Category ID to associate with the keyword
 */
export function saveUserKeyword(title: string, categoryId: string): void {
    const keyword = extractKeyword(title);
    if (!keyword) return; // Slovo příliš krátké, neukládáme
    
    if (typeof window === "undefined") return;
    
    try {
        const keywords = loadUserKeywords();
        
        // Najdi, zda keyword už existuje
        const existingIndex = keywords.findIndex(k => k.keyword === keyword);
        
        if (existingIndex >= 0) {
            // Přepiš existující (aktualizuj categoryId a timestamp)
            keywords[existingIndex] = {
                keyword,
                categoryId,
                learnedAt: Date.now()
            };
        } else {
            // Přidej nový
            keywords.push({
                keyword,
                categoryId,
                learnedAt: Date.now()
            });
        }
        
        localStorage.setItem(USER_KEYWORDS_STORAGE_KEY, JSON.stringify(keywords));
    } catch (error) {
        console.error("Error saving user keyword:", error);
    }
}

/**
 * Tries to find a category using user-learned keywords.
 * Searches the transaction title for any matching user keywords.
 * 
 * @param title Transaction title to search in
 * @param categories Available categories (to validate categoryId exists)
 * @returns Matching category ID or null if no match found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLearnedCategory(title: string, categories: any[]): string | null {
    const keywords = loadUserKeywords();
    if (keywords.length === 0) return null;
    
    const lowerTitle = title.toLowerCase();
    
    // Hledej v user keywords
    for (const entry of keywords) {
        if (lowerTitle.includes(entry.keyword)) {
            // Ověř, že kategorie stále existuje
            if (categories.some(c => c.id === entry.categoryId)) {
                return entry.categoryId;
            }
        }
    }
    
    return null;
}

/**
 * Removes all keywords associated with a deleted category.
 * Call this when a category is deleted to clean up user keywords.
 * 
 * @param categoryId Category ID to remove from keywords
 */
export function cleanupKeywordsForDeletedCategory(categoryId: string): void {
    if (typeof window === "undefined") return;
    
    try {
        const keywords = loadUserKeywords();
        const filtered = keywords.filter(k => k.categoryId !== categoryId);
        
        if (filtered.length !== keywords.length) {
            localStorage.setItem(USER_KEYWORDS_STORAGE_KEY, JSON.stringify(filtered));
        }
    } catch (error) {
        console.error("Error cleaning up keywords:", error);
    }
}
