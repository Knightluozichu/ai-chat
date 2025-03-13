import { createContext, useContext } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface MermaidThemeContextType {
  isDark: boolean;
}

export const MermaidThemeContext = createContext<MermaidThemeContextType>({
  isDark: false,
});

export const MermaidThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isDark } = useThemeStore();

  return (
    <MermaidThemeContext.Provider value={{ isDark }}>
      {children}
    </MermaidThemeContext.Provider>
  );
};

export const useMermaidTheme = () => useContext(MermaidThemeContext);