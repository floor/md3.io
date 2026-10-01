// The Themes page's entry: mounts the app on #theme-app with the data the server read
// from mtrl's theme CSS.
import { createThemeApp, type ThemeApp } from './app';

const container = document.querySelector<HTMLElement>('#theme-app');
const data = document.querySelector<HTMLScriptElement>('#themes-data');
if (container && data) {
  const { roles, themes, selected } = JSON.parse(data.textContent || '{}');
  const app: ThemeApp = createThemeApp({ container, themes, roles, selected });
  // For checks and the console: the live app.
  (window as unknown as { themeApp: ThemeApp }).themeApp = app;
}
