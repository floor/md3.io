// One control per setting, built with the create* factories and kept in step with the
// store: the app applies the whole state to every control after each change, so a
// control never holds state of its own.
//
// Each control is built to sit in the trailing slot of a list item, so it carries no
// visible label of its own where the row already shows one: the switch and the radios
// are named by the row's text through ariaLabel. The slider is the exception — the
// component renders its label and takes the handle's name from the same option, so
// there the label is the row's only text (see the design note).
import createRadios from "material/components/radios";
import createSlider from "material/components/slider";
import createSwitch from "material/components/switch";
import type { RadiosSetting, Setting, Settings, SliderSetting, SwitchSetting } from "./data";
import { ICONS } from "./icons";
import { changeSetting, type Store } from "./state";

export interface Control {
  element: HTMLElement;
  /** The control's focusable element, for the row's supporting text to describe. */
  focusable: HTMLElement | null;
  /** Brings the control in line with the state, without emitting a change. */
  apply: (state: Settings) => void;
}

let radioGroups = 0;

const buildSwitch = (store: Store, setting: SwitchSetting): Control => {
  // No visible label and no supporting text: the row's headline is the label and the
  // row's supporting text describes it (the list gives both an id of its own).
  const control = createSwitch({ ariaLabel: setting.label, checked: store.get()[setting.key] });
  control.on("change", ({ checked }) => changeSetting(store, setting.key, checked));
  return {
    element: control.element,
    focusable: control.element.querySelector("input"),
    apply: (state) => {
      control.setValue(state[setting.key]);
      if (setting.disabledWhen?.(state)) control.disable();
      else control.enable();
    },
  };
};

const buildRadios = (store: Store, setting: RadiosSetting): Control => {
  // The group is named by the row's text through ariaLabel; the options keep their own
  // visible labels, which is what a radio group needs.
  const control = createRadios({
    name: `settings-${setting.key}-${++radioGroups}`,
    options: setting.options,
    value: store.get()[setting.key],
    direction: "horizontal",
    ariaLabel: setting.label,
  });
  control.on("change", ({ value }) => {
    if (value !== null) changeSetting(store, setting.key, value);
  });
  return { element: control.element, focusable: control.element, apply: (state) => control.setValue(state[setting.key]) };
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
    focusable: control.element.querySelector('[role="slider"]'),
    apply: (state) => control.setValue(state[setting.key]),
  };
};

export const buildControl = (store: Store, setting: Setting): Control => {
  if (setting.kind === "switch") return buildSwitch(store, setting);
  if (setting.kind === "radios") return buildRadios(store, setting);
  return buildSlider(store, setting);
};
