import { createSpreadsheetApp } from './app';

const app = createSpreadsheetApp();
document.getElementById('app')!.append(app.element);

// Public factory for the lifecycle check and console experiments, as in Settings.
declare global {
  interface Window { spreadsheetExample: { createSpreadsheetApp: typeof createSpreadsheetApp } }
}
window.spreadsheetExample = { createSpreadsheetApp };
