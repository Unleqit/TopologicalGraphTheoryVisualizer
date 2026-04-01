type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

// Read from localStorage, fallback to 'light'
const savedTheme: Theme = (localStorage.getItem(THEME_KEY) as Theme) || 'light';

// Apply immediately to body to prevent flicker
document.body.classList.remove('light', 'dark');
document.body.classList.add(savedTheme);

// Optional: set a CSS variable for JS-only styling
document.documentElement.style.setProperty('--theme', savedTheme);
