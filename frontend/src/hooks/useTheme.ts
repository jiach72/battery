import { useEffect, useSyncExternalStore } from 'react';
import { consoleVariableSets } from '../styles/designTokens.ts';

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const saved = window.localStorage.getItem('theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return true;
};

let themeState = getStoredTheme();
const listeners = new Set<() => void>();

const syncDomTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const variableSet = isDark ? consoleVariableSets.dark : consoleVariableSets.light;

  Object.entries(consoleVariableSets.base).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  Object.entries(variableSet).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
};

const emitThemeChange = () => {
  listeners.forEach((listener) => listener());
};

const setTheme = (isDark: boolean) => {
  themeState = isDark;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
  syncDomTheme(isDark);
  emitThemeChange();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => themeState;

if (typeof document !== 'undefined') {
  syncDomTheme(themeState);
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    syncDomTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'theme') {
        return;
      }

      setTheme(event.newValue !== 'light');
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggle = () => setTheme(!isDark);
  return { isDark, toggle, setTheme };
}
