import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <div
      className="theme-toggle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <FiMoon /> : <FiSun />}
    </div>
  );
}
