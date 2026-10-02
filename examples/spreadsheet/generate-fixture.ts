// Synthetic warehouse dispatches, deterministic; no customer or personal data.
// Reproduce: bun examples/spreadsheet/generate-fixture.ts
import { writeCSV } from './parser';
const headers = ['Dispatch', 'Ship date', 'Depot', 'Product', 'Units', 'Value EUR', 'Status', 'Notes'];
const depots = ['Lyon', 'Lille', 'Nantes', 'Bordeaux', 'Strasbourg'];
const products = ['Desk lamp', 'Storage box', 'Cable kit', 'Monitor arm', 'Packing paper'];
const rows = Array.from({ length: 3000 }, (_, i) => [
  `DSP-${String(i + 1).padStart(5, '0')}`, new Date(Date.UTC(2026, 0, 1 + i % 270)).toISOString().slice(0, 10),
  depots[i % 5], products[Math.floor(i / 5) % 5], String(1 + i % 90), ((1 + i % 90) * (12.5 + i % 13)).toFixed(2),
  ['Dispatched', 'Packed', 'On hold'][i % 3], i % 17 === 0 ? 'Fragile, handle with care' : i % 31 === 0 ? 'Dock 2\nMorning delivery' : '',
]);
await Bun.write(new URL('./dispatches.csv', import.meta.url), writeCSV([headers, ...rows]));
