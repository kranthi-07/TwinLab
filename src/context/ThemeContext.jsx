import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem("twinlab_theme");
            if (saved) return saved;
        } catch (e) {}
        return "dark"; // Default is premium dark
    });

    useEffect(() => {
        try {
            document.documentElement.setAttribute("data-theme", theme);
            document.documentElement.className = `theme-${theme}`;
            document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
            localStorage.setItem("twinlab_theme", theme);
        } catch (e) {}
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            setTheme, 
            toggleTheme, 
            isDark: theme !== "light",
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
