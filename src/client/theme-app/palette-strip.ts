// One tonal palette: its name and a strip of 18 equal cells, tones 100 to 0, each
// with its tone number in a colour that reads on it. `set(tones)` repaints it in place.
import { pipe, createBase, withElement, withLifecycle, type ElementComponent } from 'material/core/compose';

export const PALETTE_TONES = [100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const;
export interface PaletteStripOptions { key: string; label: string }

const withCells = ({ key, label }: PaletteStripOptions) => <T extends ElementComponent>(component: T) => {
  const block = component.getClass('palette');
  const name = document.createElement('h3');
  name.className = `${block}__name`;
  name.textContent = label;
  const strip = document.createElement('ol');
  strip.className = `${block}__strip`;
  strip.setAttribute('aria-label', `${label} tones`);
  const cells = PALETTE_TONES.map(tone => {
    const cell = document.createElement('li');
    cell.className = `${block}__tone`;
    cell.dataset.tone = String(tone);
    cell.textContent = String(tone);
    // M3's tones are perceptual: black reads from tone 50 up (4.6:1 or more), white below.
    cell.style.color = tone >= 50 ? '#000000' : '#ffffff';
    return cell;
  });
  strip.append(...cells);
  component.element.dataset.palette = key;
  component.element.append(name, strip);
  const set = (tones: readonly string[]) => cells.forEach((cell, i) => {
    cell.style.background = tones[i]!;
    cell.setAttribute('aria-label', `${tones[i]}, tone ${PALETTE_TONES[i]}`);
  });
  return { ...component, set };
};

export const createPaletteStrip = (options: PaletteStripOptions) => {
  const strip = pipe(createBase, withElement({ componentName: 'palette' }), withCells(options), withLifecycle())({ prefix: 'md3', componentName: 'palette' });
  return { ...strip, destroy: () => strip.lifecycle.destroy() };
};
