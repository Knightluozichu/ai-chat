import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';
export type ThemeSize = 'small' | 'medium' | 'large';

interface ThemeState {
  theme: ThemeMode;
  primaryColor: ThemeColor;
  fontSize: ThemeSize;
  borderRadius: ThemeSize;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  setPrimaryColor: (color: ThemeColor) => void;
  setFontSize: (size: ThemeSize) => void;
  setBorderRadius: (size: ThemeSize) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      primaryColor: 'blue',
      fontSize: 'medium',
      borderRadius: 'medium',
      isDark: false,

      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },

      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        get().applyTheme();
      },

      setFontSize: (size) => {
        set({ fontSize: size });
        get().applyTheme();
      },

      setBorderRadius: (size) => {
        set({ borderRadius: size });
        get().applyTheme();
      },

      applyTheme: () => {
        const { theme, primaryColor, fontSize, borderRadius } = get();
        const root = document.documentElement;
        
        // 应用主题模式
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
        
        root.classList.toggle('dark', shouldBeDark);
        set({ isDark: shouldBeDark });

        // 应用主题颜色
        const colors = {
          blue: { primary: '#3b82f6', hover: '#2563eb' },
          purple: { primary: '#8b5cf6', hover: '#7c3aed' },
          green: { primary: '#10b981', hover: '#059669' },
          red: { primary: '#ef4444', hover: '#dc2626' },
          orange: { primary: '#f97316', hover: '#ea580c' },
        };

        root.style.setProperty('--color-primary', colors[primaryColor].primary);
        root.style.setProperty('--color-primary-hover', colors[primaryColor].hover);

        // 应用字体大小
        const fontSizes = {
          small: { base: '14px', scale: '0.95' },
          medium: { base: '16px', scale: '1' },
          large: { base: '18px', scale: '1.05' },
        };

        root.style.setProperty('--font-size-base', fontSizes[fontSize].base);
        root.style.setProperty('--font-size-scale', fontSizes[fontSize].scale);

        // 应用圆角大小
        const radiusSizes = {
          small: '0.375rem',    // 6px
          medium: '0.5rem',     // 8px
          large: '0.75rem',     // 12px
        };

        root.style.setProperty('--border-radius', radiusSizes[borderRadius]);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        primaryColor: state.primaryColor,
        fontSize: state.fontSize,
        borderRadius: state.borderRadius,
      }),
    }
  )
); 