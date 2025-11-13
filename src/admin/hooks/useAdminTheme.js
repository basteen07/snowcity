import React from 'react';

const THEME_KEY = 'sc_admin_theme'; // 'light' | 'dark' | 'system'

const getStoredTheme = () => localStorage.getItem(THEME_KEY) || 'system';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyThemeClass = (mode) => {
  const root = document.documentElement;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  root.classList.toggle('dark', !!dark);
};

export default function useAdminTheme() {
  const [theme, setTheme] = React.useState(getStoredTheme());

  // Apply on mount and when theme or system preference changes
  React.useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  React.useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const isDark =
    theme === 'dark' || (theme === 'system' && prefersDark());

  return { theme, setTheme, isDark };
}