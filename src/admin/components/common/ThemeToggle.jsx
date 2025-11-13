import React from 'react';
import useAdminTheme from '../../hooks/useAdminTheme';

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useAdminTheme();

  return (
    <div className={`inline-flex items-center gap-1 ${compact ? '' : 'p-1 border rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-700'}`}>
      <button
        className={`px-2 py-1 rounded-md text-xs ${theme === 'light' ? 'bg-gray-900 text-white' : 'border dark:border-neutral-700 dark:text-neutral-200'}`}
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button
        className={`px-2 py-1 rounded-md text-xs ${theme === 'dark' ? 'bg-gray-900 text-white' : 'border dark:border-neutral-700 dark:text-neutral-200'}`}
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
      <button
        className={`px-2 py-1 rounded-md text-xs ${theme === 'system' ? 'bg-gray-900 text-white' : 'border dark:border-neutral-700 dark:text-neutral-200'}`}
        onClick={() => setTheme('system')}
      >
        System
      </button>
    </div>
  );
}