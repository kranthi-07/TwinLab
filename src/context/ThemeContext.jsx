import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const LIGHT_THEMES = ["light", "paper", "solar-light", "cyber-light"];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem("twinlab_theme");
            if (saved) return saved;
        } catch (e) {}
        return "dark"; // Default is premium dark
    });

    const isLight = LIGHT_THEMES.includes(theme);

    useEffect(() => {
        try {
            document.documentElement.setAttribute("data-theme", theme);
            document.documentElement.setAttribute("data-theme-category", isLight ? "light" : "dark");
            document.documentElement.className = `theme-${theme} ${isLight ? "theme-category-light" : "theme-category-dark"}`;
            document.documentElement.style.colorScheme = isLight ? "light" : "dark";
            localStorage.setItem("twinlab_theme", theme);
        } catch (e) {}
    }, [theme, isLight]);

    const toggleTheme = () => {
        setTheme((prev) => (LIGHT_THEMES.includes(prev) ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            setTheme, 
            toggleTheme, 
            isDark: !isLight,
            isLight,
            isGlass: theme === "glassmorphism"
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
}
