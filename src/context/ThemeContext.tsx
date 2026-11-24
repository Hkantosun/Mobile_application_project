import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@reellearn_theme_mode_v1';

export interface AppColors {
  background: string;
  surface: string;
  surfaceLow: string;
  surfaceContainer: string;
  surfaceHigh: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  primarySoftBg: string;
  primarySoftBorder: string;
  primaryPillBg: string;
  primaryPillText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  goldBg: string;
  goldIcon: string;
  goldText: string;
  error: string;
  errorSoftBg: string;
  errorSoftText: string;
  codeBg: string;
  codeText: string;
  modalOverlay: string;
  bannerBg: string;
  bannerIconBg: string;
  bannerTitle: string;
  bannerSub: string;
  bannerBtnBg: string;
  bannerBtnText: string;
  toggleOffBg: string;
}

export const LIGHT_COLORS: AppColors = {
  background: '#F6FAF5',
  surface: '#FFFFFF',
  surfaceLow: '#F0F5F0',
  surfaceContainer: '#EBEFEA',
  surfaceHigh: '#E5E9E4',
  border: '#E5E9E4',
  borderSubtle: '#DCE4DE',
  primary: '#044432',
  primaryContainer: '#245C48',
  onPrimary: '#FFFFFF',
  primarySoftBg: '#E6F7EF',
  primarySoftBorder: '#99D3B9',
  primaryPillBg: '#B5EFD5',
  primaryPillText: '#002116',
  textPrimary: '#181D1A',
  textSecondary: '#404944',
  textMuted: '#58605B',
  goldBg: '#FFF3D6',
  goldIcon: '#D97706',
  goldText: '#6B4D00',
  error: '#BA1A1A',
  errorSoftBg: '#FFDAD6',
  errorSoftText: '#93000A',
  codeBg: '#2D322E',
  codeText: '#EDF2ED',
  modalOverlay: 'rgba(24, 29, 26, 0.48)',
  bannerBg: '#044432',
  bannerIconBg: '#245C48',
  bannerTitle: '#FFFFFF',
  bannerSub: '#B5EFD5',
  bannerBtnBg: '#FFFFFF',
  bannerBtnText: '#044432',
  toggleOffBg: '#DFE4DF',
};

export const DARK_COLORS: AppColors = {
  background: '#0E1412',
  surface: '#161F1C',
  surfaceLow: '#1C2623',
  surfaceContainer: '#222E2A',
  surfaceHigh: '#293732',
  border: '#25322D',
  borderSubtle: '#2E3D37',
  primary: '#4EDEA3',
  primaryContainer: '#245C48',
  onPrimary: '#002116',
  primarySoftBg: 'rgba(78, 222, 163, 0.14)',
  primarySoftBorder: '#2E7D60',
  primaryPillBg: 'rgba(78, 222, 163, 0.2)',
  primaryPillText: '#8EF2C6',
  textPrimary: '#E8F0EC',
  textSecondary: '#B8C7BF',
  textMuted: '#8B9C94',
  goldBg: 'rgba(236, 192, 104, 0.16)',
  goldIcon: '#FBBF24',
  goldText: '#FDE68A',
  error: '#FFB4AB',
  errorSoftBg: 'rgba(186, 26, 26, 0.24)',
  errorSoftText: '#FFDAD6',
  codeBg: '#0A0E0D',
  codeText: '#8EF2C6',
  modalOverlay: 'rgba(0, 0, 0, 0.72)',
  bannerBg: '#16382C',
  bannerIconBg: '#245C48',
  bannerTitle: '#E8F0EC',
  bannerSub: '#99D3B9',
  bannerBtnBg: '#4EDEA3',
  bannerBtnText: '#002116',
  toggleOffBg: '#32423C',
};

interface ThemeContextValue {
  isDark: boolean;
  colors: AppColors;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(saved => {
        if (saved === 'dark') setIsDark(true);
      })
      .catch(() => {});
  }, []);

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    AsyncStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light').catch(() => {});
  };

  const toggleTheme = () => {
    setDarkMode(!isDark);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? DARK_COLORS : LIGHT_COLORS,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
