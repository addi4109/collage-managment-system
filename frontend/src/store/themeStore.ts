import { create } from 'zustand';

interface ThemeState {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: (localStorage.getItem('themeMode') as 'light' | 'dark') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const nextMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', nextMode);
      return { themeMode: nextMode };
    }),
}));
