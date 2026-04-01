export type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

function get(): Theme {
  if (localStorage.theme !== undefined) {
    document.documentElement.setAttribute('theme', localStorage.theme);
    return localStorage.theme;
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('theme', 'dark');
      return 'dark';
    } else {
      document.documentElement.setAttribute('theme', 'light');
      return 'light';
    }
  }
}

function toggle(): void {
  if (document.documentElement.getAttribute('theme') === 'dark') {
    document.documentElement.setAttribute('theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
  updateButton(localStorage.theme);
}

function updateButton(theme: Theme): void {
  const btn = document.getElementById('theme-toggle-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = theme === 'light' ? 'Switch to Dark' : 'Switch to Light';
  }
}

function injectThemeToggleButton(): void {
  if (document.getElementById('theme-toggle-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'theme-toggle-btn';
  button.className = 'theme-toggle-btn';
  button.addEventListener('click', toggle);
  document.body.appendChild(button);
  updateButton(get());
}

function initTheme(): void {
  get();
  injectThemeToggleButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
