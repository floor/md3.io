// A component's Anatomy figure (src/server/component-properties.ts): numbered callouts, a dot on each
// part and a line to its number outside the component, placed on the parts it measures so they follow
// the font and the theme. 1 is the container; each `[data-part]` (in the page, or `data-part-shadow` on
// the host: "selector:n" inside its shadow root) is a part, its number on the left or, for
// `data-part-side` right, top or bottom, there; `data-container-at` places 1 (a fraction of the height).
export function anatomy(visual: Element): (() => void) | void {
  const figure = visual.querySelector<HTMLElement>('.property-anatomy');
  const host = figure?.querySelector<HTMLElement>('[data-anatomy]');
  if (!figure || !host) return;
  const layer = document.createElement('div');
  layer.className = 'property-anatomy__callouts';
  layer.setAttribute('aria-hidden', 'true');
  figure.append(layer);
  const place = () => {
    const base = figure.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    type Side = 'left' | 'right' | 'top' | 'bottom';
    const callout = (n: string, x: number, y: number, side: Side) => {
      if (side === 'top' || side === 'bottom') {
        const ny = side === 'top' ? box.top - base.top - 44 : box.bottom - base.top + 20;
        const from = side === 'top' ? ny + 24 : y;
        const to = side === 'top' ? y : ny;
        return `<span class="property-anatomy__line property-anatomy__line--v" style="left:${x}px;top:${from}px;height:${Math.max(0, to - from)}px"></span>`
          + `<span class="property-anatomy__dot" style="left:${x - 4}px;top:${y - 4}px"></span>`
          + `<span class="property-number property-anatomy__number" style="left:${x - 12}px;top:${ny}px">${n}</span>`;
      }
      const outside = side === 'left' ? box.left - base.left - 56 : box.right - base.left + 24;
      const start = side === 'left' ? outside + 24 : x;
      const end = side === 'left' ? x : outside;
      return `<span class="property-anatomy__line" style="left:${start}px;top:${y}px;width:${Math.max(0, end - start)}px"></span>`
        + `<span class="property-anatomy__dot" style="left:${x - 4}px;top:${y - 4}px"></span>`
        + `<span class="property-number property-anatomy__number" style="left:${outside}px;top:${y - 12}px">${n}</span>`;
    };
    const at = (element: Element, n: string, side: Side) => {
      const r = element.getBoundingClientRect();
      if (side === 'top') return callout(n, r.left + r.width / 2 - base.left, r.top - base.top, side);
      if (side === 'bottom') return callout(n, r.left + Math.min(16, r.width / 2) - base.left, r.bottom - base.top, side);
      return callout(n, (side === 'right' ? r.right : r.left) - base.left, r.top - base.top + r.height / 2, side);
    };
    const parts = [...host.querySelectorAll<HTMLElement>('[data-part]')].map(part => at(part, part.dataset.part!, (part.dataset.partSide as Side | undefined) ?? 'left'));
    for (const entry of (host.dataset.partShadow ?? '').split(',').filter(Boolean)) {
      const [selector, n, side] = entry.split(':');
      const element = host.shadowRoot?.querySelector(selector!);
      if (element) parts.push(at(element, n!, (side as Side | undefined) ?? 'left'));
    }
    layer.innerHTML = callout('1', box.left - base.left, box.top - base.top + box.height * Number(host.dataset.containerAt ?? 0.5), 'left') + parts.join('');
  };
  const observer = new ResizeObserver(place);
  observer.observe(figure);
  requestAnimationFrame(() => requestAnimationFrame(place));
  return () => { observer.disconnect(); layer.remove(); };
}
