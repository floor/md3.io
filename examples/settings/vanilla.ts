// Vanilla: the create* factories the elements are built on. The screen is in app.ts,
// the fixture in data.ts, the state in state.ts, each control in controls.ts.
import { createSettingsApp, type SettingsApp } from "./app";

const app = createSettingsApp();
document.getElementById("app")!.append(app.element);

// For the check and the console: the live app and its factory, as the site's theme app
// exposes itself (src/client/theme-app/index.ts). The check mounts a second app through
// this and tears it down, proving the app's state is per mount.
declare global {
  interface Window {
    settingsExample: { app: SettingsApp; createSettingsApp: () => SettingsApp };
  }
}
window.settingsExample = { app, createSettingsApp };
