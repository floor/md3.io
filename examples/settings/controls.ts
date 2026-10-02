// One control per setting, built with the create* factories and kept in step with the
// store: the app applies the whole state to every control after each change, so a
// control never holds state of its own.
//
// Each control is built to sit in the trailing slot of a list item, so it carries no
// visible label of its own where the row already shows one: the switch is named by the
// row's text through ariaLabel — the naming the docs put on the app ("a trailing control
// is the app's to name", list.md). The row's supporting text stays the row's text: a
// switch row today has a name and no description, because the list exposes no public
// handle on its supporting element (FLO-590) and the switch's own `supportingText`
// renders a visible helper under the control, which would print the row's text twice.
// The slider is the exception: it renders its own label and takes the handle's name from
// the same option, and the trailing slot is too narrow for it, so it stands in a block
// of its own instead (see the design note).
import createSlider from "material/components/slider";
import createSwitch from "material/components/switch";
import type { Setting, Settings, SliderSetting, SwitchSetting } from "./data";
import { ICONS } from "./icons";
import { changeSetting, type Store } from "./state";

export interface Control {
  element: HTMLElement;
  /** Brings the control in line with the state, without emitting a change. */
  apply: (state: Settings) => void;
  /** Removes the control's listeners and its element, for the app's destroy(). */
  destroy: () => void;
}

const buildSwitch = (store: Store, setting: SwitchSetting): Control => {
  // No visible label here: the row's text names it (see the file comment).
  const control = createSwitch({ ariaLabel: setting.label, checked: store.get()[setting.key] });
  control.on("change", ({ checked }) => changeSetting(store, setting.key, checked));
  return {
    element: control.element,
    apply: (state) => {
      control.setValue(state[setting.key]);
      if (setting.disabledWhen?.(state)) control.disable();
      else control.enable();
    },
    destroy: () => control.destroy(),
  };
};

const buildSlider = (store: Store, setting: SliderSetting): Control => {
  const control = createSlider({
    label: setting.label,
    min: setting.min,
    max: setting.max,
    step: setting.step,
    value: store.get()[setting.key],
    size: "M",
    insetIcon: setting.icon ? ICONS[setting.icon] : undefined,
    insetIconAtMin: setting.iconAtMin ? ICONS[setting.iconAtMin] : undefined,
  });
  control.on("change", ({ value }) => changeSetting(store, setting.key, value));
  return {
    element: control.element,
    apply: (state) => control.setValue(state[setting.key]),
    destroy: () => control.destroy(),
  };
};

export const buildControl = (store: Store, setting: Setting): Control => {
  if (setting.kind === "switch") return buildSwitch(store, setting);
  return buildSlider(store, setting);
};
