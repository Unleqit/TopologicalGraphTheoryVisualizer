export type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

// ------------------- Storage -------------------
function getSavedTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
}

function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ------------------- Apply Theme -------------------
export function applyTheme(theme: Theme) {
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(theme);
  saveTheme(theme);
  updateButton(theme);
}

// ------------------- Toggle -------------------
function toggleTheme() {
  const next: Theme = getSavedTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next);
}

// ------------------- Update Button -------------------
function updateButton(theme: Theme) {
  const btn = document.getElementById('theme-toggle-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = theme === 'light' ? 'Switch to Dark' : 'Switch to Light';
  }
}

// ------------------- Inject Toggle Button -------------------
function injectThemeToggleButton() {
  if (document.getElementById('theme-toggle-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'theme-toggle-btn';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '1000';
  button.style.padding = '6px 12px';
  button.style.backgroundColor = 'rgba(0,0,0,0.2)';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.addEventListener('click', toggleTheme);

  document.body.appendChild(button);

  // Set initial label
  updateButton(getSavedTheme());
}

// ------------------- Init -------------------
export function initTheme() {
  injectThemeToggleButton();
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
