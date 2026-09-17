import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Represents the theme of the application, which can be either "light" or "dark".
 */
type Theme = "light" | "dark";

/**
 * Context type for the ThemeContext, providing the current theme and a function to toggle between themes.
 */
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * A React context provider for managing the application's theme.
 * 
 * @param param0 - An object containing the children components that will have access to the theme context. 
 * @returns - A ThemeContext.Provider component that wraps the children and provides the current theme and a toggle function.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // Initialize the theme state based on localStorage or system preference
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") { // Check if the code is running in a browser environment
            const savedTheme = localStorage.getItem("theme") as Theme;
            if (savedTheme) return savedTheme;

            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }
        }
        return "light";
    });

    // Update the document's root class and localStorage whenever the theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    // Provide the current theme and toggle function to the context consumers
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * A custom hook for using the ThemeContext.
 * 
 * @returns - The current theme and a function to toggle between themes.
 */
export function useTheme() {
    // useContext - Access the ThemeContext to get the current theme and toggle function
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
