
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false, // Changed to default to light theme first
      toggleTheme: () => set((state) => {
        const newIsDark = !state.isDark;
        applyTheme(newIsDark);
        return { isDark: newIsDark };
      }),
      setTheme: (isDark) => set(() => {
        applyTheme(isDark);
        return { isDark };
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Function to apply theme to document
export const applyTheme = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }
};

// Initialize theme on import
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage');
  const theme = stored ? JSON.parse(stored) : { state: { isDark: false } };
  applyTheme(theme.state?.isDark || false);
}
