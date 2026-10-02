import type { ExampleMeta } from '../types';
export default {
  slug: 'spreadsheet', title: 'Spreadsheet', variants: ['vanilla'],
  description: 'Open, inspect, edit and export local CSV files in a virtual table.',
  components: ['button', 'text-field', 'menu', 'snackbar', 'checkbox', 'top-app-bar', 'side-sheet', 'bottom-sheet', 'dialog'],
  about: ['A local CSV workbench with a generated warehouse fixture. All data stays in this browser.', 'This version reads and writes CSV. Framework ports and Excel import are follow-ups.'],
  how: ['Native CSV parsing and sparse edits preserve cell text. vlist renders only the visible rows.', 'Export includes filtered, sorted rows and every column, including hidden columns.'],
} satisfies ExampleMeta;
