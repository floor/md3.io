// The Themes page owns its app and all overlays through destroy().
import { createThemeApp, type ThemeApp } from './app';
import { enterThemePage } from '../theme-store';
import { registerPage } from '../page-lifecycle';
registerPage('theme-app', (content, life) => {
  enterThemePage();
  const container = content.querySelector<HTMLElement>('#theme-app');
  const data = content.querySelector<HTMLScriptElement>('#themes-data');
  if (container && data) {
    const { roles, themes, selected } = JSON.parse(data.textContent || '{}');
    const app: ThemeApp = createThemeApp({ container, themes, roles, selected });
    (window as unknown as { themeApp?: ThemeApp }).themeApp = app;
    life.add(() => { app.destroy(); delete (window as unknown as { themeApp?: ThemeApp }).themeApp; });
  }
});
