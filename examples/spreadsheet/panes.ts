import createSideSheet from 'material/components/side-sheet';
import createBottomSheet from 'material/components/bottom-sheet';
import { button } from './ui';

/** Same controls move between surfaces, so changing width preserves their state. */
export function supportingTools(section: HTMLElement, content: HTMLElement) {
  const close = button('Done', () => sheet.close()); content.append(close.element);
  const opener = button('Tools', () => sheet.open());
  let sheet: ReturnType<typeof createSideSheet> | ReturnType<typeof createBottomSheet>;
  let category = '';
  function adapt() {
    const next = innerWidth < 600 ? 'compact' : innerWidth < 840 ? 'medium' : 'expanded';
    if (next === category) return;
    content.remove(); sheet?.destroy(); category = next;
    section.dataset.pane = next;
    const events = { open: () => { section.dataset.toolsOpen = 'true'; }, close: () => { section.dataset.toolsOpen = 'false'; } };
    if (next !== 'expanded') sheet = createBottomSheet({ variant: 'modal', title: 'Data tools', content, layer: 'top', on: events });
    else sheet = createSideSheet({ variant: next === 'expanded' ? 'standard' : 'modal', title: 'Data tools', content, width: 360, layer: next === 'expanded' ? undefined : 'top', on: events });
    section.dataset.toolsOpen = 'false';
    if (next === 'expanded') sheet.open();
  }
  adapt(); window.addEventListener('resize', adapt);
  return { opener, close: () => sheet.close() };
}
