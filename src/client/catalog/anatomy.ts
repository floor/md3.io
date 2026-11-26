// A component's Anatomy figure (src/server/component-properties.ts): numbered callouts, a dot on each
// part and a line to its number outside the component, placed on the parts it measures so they follow
// the font and the theme. 1 is the container; each `[data-part]` (in the page, or `data-part-shadow` on
// the host: "selector:n:side" inside its shadow root) is a part, parts with one number share a bracket; its number on the left or, for
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
    // The visible part, not its box: a text's glyphs, or an icon button's 24px icon at its centre.
    const tight = (element: Element): DOMRect => {
      const r = element.getBoundingClientRect();
      if (element.textContent?.trim() && !element.matches('m-icon-button, m-button')) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const t = range.getBoundingClientRect();
        if (t.width) return t;
      }
      if (element.matches('m-icon-button')) {
        const icon = element.querySelector('svg') ?? element.shadowRoot?.querySelector('svg');
        if (icon) return icon.getBoundingClientRect();
      }
      return r;
    };
    // Parts sharing a number under one callout: a bracket across them, the line from its middle.
    const at = (elements: Element[], n: string, side: Side) => {
      const rects = elements.map(tight);
      const r = rects.reduce((u, v) => new DOMRect(Math.min(u.left, v.left), Math.min(u.top, v.top), Math.max(u.right, v.right) - Math.min(u.left, v.left), Math.max(u.bottom, v.bottom) - Math.min(u.top, v.top)));
      if (side === 'top' || side === 'bottom') {
        const y = (side === 'top' ? r.top - 6 : r.bottom + 6) - base.top;
        const x = (rects.length > 1 ? r.left + r.width / 2 : r.left + Math.min(12, r.width / 2)) - base.left;
        const bracket = rects.length > 1 ? `<span class="property-anatomy__line property-anatomy__line--dotted" style="left:${r.left - base.left}px;top:${y}px;width:${r.width}px"></span>` : '';
        return bracket + callout(n, x, y, side);
      }
      return callout(n, (side === 'right' ? r.right + 4 : r.left - 4) - base.left, r.top - base.top + r.height / 2, side);
    };
    const groups = new Map<string, { elements: Element[]; side: Side }>();
    const add = (element: Element, n: string, side: Side) => { const g = groups.get(n) ?? { elements: [], side }; g.elements.push(element); groups.set(n, g); };
    for (const part of host.querySelectorAll<HTMLElement>('[data-part]')) add(part, part.dataset.part!, (part.dataset.partSide as Side | undefined) ?? 'left');
    for (const entry of (host.dataset.partShadow ?? '').split(',').filter(Boolean)) {
      const [selector, n, side] = entry.split(':');
      const element = host.shadowRoot?.querySelector(selector!);
      if (element) add(element, n!, (side as Side | undefined) ?? 'left');
    }
    const parts = [...groups].map(([n, g]) => at(g.elements, n, g.side));
    layer.innerHTML = callout('1', box.left - base.left, box.top - base.top + box.height * Number(host.dataset.containerAt ?? 0.5), 'left') + parts.join('');
  };
  const observer = new ResizeObserver(place);
  observer.observe(figure);
  requestAnimationFrame(() => requestAnimationFrame(place));
  return () => { observer.disconnect(); layer.remove(); };
}
