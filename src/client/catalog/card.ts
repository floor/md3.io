// The Card card: <m-card>, with <m-button> from that card's module. In a card's Anatomy figure
// (src/server/component-properties.ts), numbered callouts are placed on the parts it measures.
import 'material/elements/css/card';
import { defineCard } from 'material/elements';
import { define as defineButtonCard } from './button';

/** Callouts on the anatomy card's parts: 1 the container, then each `[data-part]`, a dot on the part and a line to a number outside the card. */
function anatomy(visual: Element): (() => void) | void {
  const figure = visual.querySelector<HTMLElement>('.property-anatomy');
  const card = figure?.querySelector<HTMLElement>('m-card');
  if (!figure || !card) return;
  const layer = document.createElement('div');
  layer.className = 'property-anatomy__callouts';
  layer.setAttribute('aria-hidden', 'true');
  figure.append(layer);
  const place = () => {
    const base = figure.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const callout = (n: string, x: number, y: number, side: 'left' | 'right') => {
      const outside = side === 'left' ? box.left - base.left - 56 : box.right - base.left + 24;
      return `<span class="property-anatomy__line" style="left:${Math.min(x, outside + 32)}px;top:${y}px;width:${Math.abs(x - (outside + (side === 'left' ? 32 : 0)))}px"></span>`
        + `<span class="property-anatomy__dot" style="left:${x - 4}px;top:${y - 4}px"></span>`
        + `<span class="property-number property-anatomy__number" style="left:${outside}px;top:${y - 12}px">${n}</span>`;
    };
    const parts = [...card.querySelectorAll<HTMLElement>('[data-part]')].map(part => {
      const r = part.getBoundingClientRect();
      const n = part.dataset.part!;
      const right = n === '2' || n === '6';
      return callout(n, (right ? r.right : r.left) - base.left, r.top - base.top + r.height / 2, right ? 'right' : 'left');
    });
    layer.innerHTML = callout('1', box.left - base.left, box.top - base.top + box.height * 0.2, 'left') + parts.join('');
  };
  const observer = new ResizeObserver(place);
  observer.observe(figure);
  requestAnimationFrame(place);
  return () => { observer.disconnect(); layer.remove(); };
}

export const define = (visual?: Element): void | (() => void) => {
  defineButtonCard();
  defineCard();
  return visual ? anatomy(visual) : undefined;
};
