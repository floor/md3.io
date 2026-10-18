// The Button playground pilot's client half. The server renders the panel's
// controls as material's elements with declarative shadow DOM
// (src/server/playground-panel.ts), styled at first paint; this module, loaded
// only on the pilot's pages and before playground.js, defines those elements
// and wires the button groups into the configuration form.
//
// The button group is not form-associated: each group carries a hidden input
// with the control's name, kept in sync with the group's selection, which
// fires the same events a native radio did. The glue lives here, in one
// module: nothing else on the page knows a group is behind a control.
//
// A group of buttons is not a radio group: material's group leaves every
// button a tab stop and gives arrows no meaning. The native radio group the
// pilot replaced had one tab stop and arrow-key selection, so the glue restores
// that — roving tabindex, and arrows, Home and End moving the selection with
// the focus.
import 'material/elements/css/select';
import 'material/elements/css/switch';
import 'material/elements/css/text-field';
import 'material/elements/css/tabs';
import 'material/elements/css/button-group';
import 'material/elements/css/button';
import { defineButton, defineButtonGroup, defineSelect, defineSwitch, defineTabs, defineTextField } from 'material/elements';

defineSelect();
defineSwitch();
defineTextField();
defineTabs();
defineButtonGroup();
defineButton();

type GroupHost = HTMLElement & { value: string | string[] | null };
type GroupButton = HTMLButtonElement;

for (const group of document.querySelectorAll<GroupHost>('m-button-group[data-group-for]')) {
  const name = group.getAttribute('data-group-for')!;
  const input = document.querySelector<HTMLInputElement>(`input[data-input-for="${name}"]`);
  if (!input) continue;
  // A hidden input's value IS its attribute: a commit's `.value =` rewrites
  // the reset default with it. The glue owns the input, so the default lives
  // here instead: what the server rendered, rebased only by an explicit
  // `defaultValue =` write (playground.js's applyAppearance makes one, as it
  // loads after this module, for a remembered appearance).
  const buttons = (): GroupButton[] => [...group.shadowRoot?.querySelectorAll<GroupButton>('button') ?? []];
  const current = (): string | null => typeof group.value === 'string' ? group.value : null;
  let initial = input.getAttribute('value') ?? '';
  const defaultDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'defaultValue')!;
  Object.defineProperty(input, 'defaultValue', {
    get: defaultDescriptor.get,
    set(reset) { initial = String(reset); defaultDescriptor.set!.call(input, reset); },
  });

  // The hidden input is the form's control: every selection writes it, and a
  // person's selection fires the events the native radio group fired. A
  // programmatic one — playground.ts's sync setting the group — reports through
  // the value property below, without events: the sync already knows the state.
  const commit = (fire: boolean) => {
    input.value = current() ?? '';
    if (!fire) return;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  group.addEventListener('change', () => commit(true));

  // A sync sets the group's value expecting the form to carry it from there; the
  // property passes through a wrapper so the input follows in the same tick, not
  // an observer's microtask later, when the sync's own read has already run.
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(group), 'value')!;
  Object.defineProperty(group, 'value', {
    get: descriptor.get,
    set(value: string | string[] | null) { descriptor.set!.call(group, value); commit(false); },
  });

  // A form reset restores the elements from their attributes; the input's
  // attribute was whatever the last commit wrote, so the glue restores the
  // default itself, before the panel's own reset handler reads the form (this
  // listener is registered first, so its timeout runs first).
  input.form?.addEventListener('reset', () => setTimeout(() => {
    group.value = initial;
  }, 0));

  // The group's own buttons keep their state in aria-pressed; the roving tab
  // stop follows the selection, wherever it came from.
  const rove = () => {
    const selected = current();
    for (const button of buttons()) button.tabIndex = button.value === selected ? 0 : -1;
  };
  new MutationObserver(rove).observe(group, { attributes: true, attributeFilter: ['value'], subtree: false });
  const watchPressed = () => {
    for (const button of buttons()) {
      if (button.dataset.roved) continue;
      button.dataset.roved = '1';
      new MutationObserver(rove).observe(button, { attributes: true, attributeFilter: ['aria-pressed'] });
    }
  };
  rove();
  watchPressed();
  new MutationObserver(() => { rove(); watchPressed(); }).observe(group.shadowRoot!, { childList: true, subtree: true });

  // Keyboard selection, as the native radio group had it: arrows and Home/End
  // move the selection with the focus.
  const select = (button: GroupButton) => {
    button.focus();
    if (button.value !== current()) button.click();
  };
  group.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const list = buttons();
    if (!list.length) return;
    const index = list.findIndex(button => button.value === current());
    const target = event.key === 'Home' ? list[0]!
      : event.key === 'End' ? list.at(-1)!
      : list[(index + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length]!;
    event.preventDefault();
    select(target);
  });
}
