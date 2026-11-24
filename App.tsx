import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StorageService } from './src/services/storageService';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { BadgeProvider } from './src/context/BadgeContext';

const AppContent = () => {
  const { isDark } = useAppTheme();

  useEffect(() => {
    StorageService.initialize();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BadgeProvider>
          <AppContent />
        </BadgeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
