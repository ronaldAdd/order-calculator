// components/DarkModeToggle.tsx
import useTheme from '@/hooks/useTheme';

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors"
    >
      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
}
