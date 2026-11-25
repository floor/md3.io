// The playground panel's client half. The server renders the panel's controls
// as material's elements with declarative shadow DOM
// (src/server/playground-panel.ts), styled at first paint; this module, loaded
// on every component page before playground.js, defines those elements and
// wires the button groups and the date and time pickers into the form.
//
// The button group is not form-associated: each group carries a hidden input
// with the control's name, kept in sync with the group's selection, which
// fires the same events a native radio did. The glue lives here, in one
// module: nothing else on the page knows a group is behind a control.
//
// A group of buttons is not a radio group: material's group leaves every
// button a tab stop and gives arrows no meaning. The native radio group the
// panel replaced had one tab stop and arrow-key selection, so the glue restores
// that — roving tabindex, and arrows, Home and End moving the selection with
// the focus.
import 'material/elements/css/select';
import 'material/elements/css/switch';
import 'material/elements/css/text-field';
import 'material/elements/css/tabs';
import 'material/elements/css/button-group';
import 'material/elements/css/button';
import 'material/elements/css/icon-button';
import 'material/elements/css/chips';
import 'material/elements/css/slider';
import 'material/elements/css/snackbar';
import 'material/elements/css/datepicker';
import 'material/elements/css/timepicker';
import { defineButton, defineButtonGroup, defineIconButton, defineChips, defineDatepicker, defineSelect, defineSlider, defineSnackbar, defineTimepicker, defineSwitch, defineTabs, defineTextField } from 'material/elements';
import { registerPage } from './page-lifecycle';
registerPage('playground-material', (content, life) => {
  // A settings select's menu is fixed to the window, placed when it opens. material moves it
  // with the window's scroll, but only from 20ms after opening, and not with a layout shift:
  // a field moved meanwhile left its menu hanging (Radio buttons' Selected, now and then).
  // While a menu is open, a moved field re-places it (material repositions on scroll).
  const settings = content.querySelector<HTMLElement>('#configuration');
  if (settings) {
    let frame = 0;
    const openSelect = () => [...settings.querySelectorAll('m-select')].find(select => select.shadowRoot?.querySelector('.mtrl-menu--visible'));
    const watch = () => {
      if (frame) return;
      let last = '';
      let waiting = 30;
      const tick = () => {
        const select = openSelect();
        if (!select) { frame = waiting-- > 0 && !last ? requestAnimationFrame(tick) : 0; return; }
        const { top, left } = select.getBoundingClientRect();
        const at = `${Math.round(top)},${Math.round(left)}`;
        if (at !== last) window.dispatchEvent(new Event('scroll'));
        last = at;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    life.events(settings).addEventListener('click', watch);
    life.events(settings).addEventListener('keydown', watch);
    life.add(() => cancelAnimationFrame(frame));
  }
  // Settings opens the configuration as a side sheet beside the preview, and closes it.
  const playground = content.querySelector<HTMLElement>('.playground');
  const settingsToggle = content.querySelector<HTMLElement>('#settings-toggle');
  if (playground && settingsToggle) {
    // A toggle icon button: its own pressed state (aria-pressed) says whether the sheet is open.
    const toggle = settingsToggle as HTMLElement & { selected?: boolean };
    const setOpen = (open: boolean) => {
      playground.toggleAttribute('data-settings-open', open);
      if (toggle.selected !== open) toggle.selected = open;
    };
    setOpen(false);
    life.events(settingsToggle).addEventListener('change', () => setOpen(Boolean(toggle.selected)));
  }
  defineSelect();
  defineSwitch();
  defineTextField();
  defineTabs();
  defineButtonGroup();
  defineButton();
  defineIconButton();
  defineChips();
  defineSlider();
  defineSnackbar();
  defineDatepicker();
  defineTimepicker();

  // A click in the text field's hit outset lands on the field wrapper.
  life.events(content.querySelector('#configuration'))?.addEventListener('click', event => {
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLElement) || !target.matches('[part~="field"]')) return;
    const root = target.getRootNode();
    if (root instanceof ShadowRoot && root.host.matches('m-text-field:not([disabled])')) {
      target.querySelector<HTMLElement>('[part~="input"]')?.focus();
    }
  });

  type GroupHost = HTMLElement & { value: string | string[] | null };
  type GroupButton = HTMLButtonElement;

  for (const group of content.querySelectorAll<GroupHost>('m-button-group[data-group-for]')) {
    const name = group.getAttribute('data-group-for')!;
    const input = content.querySelector<HTMLInputElement>(`input[data-input-for="${name}"]`);
    if (!input) continue;
    const buttons = (): GroupButton[] => [...group.shadowRoot?.querySelectorAll<GroupButton>('button') ?? []];
    const current = (): string | null => typeof group.value === 'string' ? group.value : null;

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
    life.events(group).addEventListener('change', () => commit(true));

    // A sync sets the group's value expecting the form to carry it from there; the
    // property passes through a wrapper so the input follows in the same tick, not
    // an observer's microtask later, when the sync's own read has already run.
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(group), 'value')!;
    Object.defineProperty(group, 'value', {
      get: descriptor.get,
      set(value: string | string[] | null) { descriptor.set!.call(group, value); commit(false); },
    });

    // The group's own buttons keep their state in aria-pressed; the roving tab
    // stop follows the selection, wherever it came from.
    const rove = () => {
      const selected = current();
      for (const button of buttons()) button.tabIndex = button.value === selected ? 0 : -1;
    };
    life.observer(new MutationObserver(rove)).observe(group, { attributes: true, attributeFilter: ['value'], subtree: false });
    const watchPressed = () => {
      for (const button of buttons()) {
        if (button.dataset.roved) continue;
        button.dataset.roved = '1';
        life.observer(new MutationObserver(rove)).observe(button, { attributes: true, attributeFilter: ['aria-pressed'] });
      }
    };
    rove();
    watchPressed();
    life.observer(new MutationObserver(() => { rove(); watchPressed(); })).observe(group.shadowRoot!, { childList: true, subtree: true });

    // Keyboard selection, as the native radio group had it: arrows and Home/End
    // move the selection with the focus.
    const select = (button: GroupButton) => {
      button.focus();
      if (button.value !== current()) button.click();
    };
    life.events(group).addEventListener('keydown', event => {
      // Up and Down move the selection too, as they did in the native radio group.
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const list = buttons();
      if (!list.length) return;
      const index = list.findIndex(button => button.value === current());
      const target = event.key === 'Home' ? list[0]!
        : event.key === 'End' ? list.at(-1)!
        : list[(index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]!;
      event.preventDefault();
      select(target);
    });
  }

  // The date and time rows: a text field whose trailing icon opens material's date
  // picker (modal) or time picker. One picker of each kind, made on first use inside
  // the panel's scope so the dialog takes the panel's tokens; a pick writes the
  // field and reports it as the edit typing would.
  type PickerHost = HTMLElement & { value: unknown; show(): void };
  const pickers = new Map<string, PickerHost>();
  const pickerFor = (kind: 'date' | 'time'): PickerHost => {
    let picker = pickers.get(kind);
    if (!picker) {
      picker = document.createElement(kind === 'date' ? 'm-datepicker' : 'm-timepicker') as PickerHost;
      picker.setAttribute('data-panel-picker', '');
      if (kind === 'date') { picker.setAttribute('variant', 'modal'); picker.setAttribute('close-on-select', ''); }
      else picker.setAttribute('format', '24h');
      picker.hidden = false;
      content.querySelector('#configuration')!.append(picker);
      pickers.set(kind, picker);
    }
    return picker;
  };
  let pickingFor: (HTMLElement & { value: unknown }) | null = null;
  life.events(content.querySelector('#configuration'))?.addEventListener('trailing', event => {
    const field = event.target as HTMLElement & { value: unknown };
    const kind = field.getAttribute('data-picker');
    if (kind !== 'date' && kind !== 'time') return;
    const picker = pickerFor(kind);
    pickingFor = field;
    picker.setAttribute('aria-label', field.getAttribute('aria-label') ?? '');
    picker.value = String(field.value ?? '');
    picker.show();
  });
  // The pickers' own `input` (the time dial and fields report their draft) is not
  // the form's either: it never reaches the panel, so a draft the person cancels
  // does not turn the scenario to Custom. Only a confirmed pick writes the field.
  life.events(content.querySelector('#configuration'))?.addEventListener('input', event => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute('data-panel-picker')) event.stopPropagation();
  }, true);
  for (const kind of ['date', 'time'] as const) {
    life.events(content.querySelector('#configuration'))?.addEventListener('change', event => {
      const picker = pickers.get(kind);
      if (!picker || event.target !== picker || !pickingFor) return;
      // The picker's change is not the form's: it stops here, and the field reports.
      event.stopPropagation();
      const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? picker.value;
      if (typeof value !== 'string' || !value) return;
      // The date picker commits on every day click, the one already shown too:
      // re-picking the field's own value is no edit.
      if (String(pickingFor.value ?? '') === value) return;
      pickingFor.value = value;
      pickingFor.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }, true);
  }
});
