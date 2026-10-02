// One control per setting, built with the create* factories and kept in step with the
// store: the app applies the whole state to every control after each change, so a
// control never holds state of its own.
import createRadios from "material/components/radios";
import createSlider from "material/components/slider";
import createSwitch from "material/components/switch";
import type { RadiosSetting, Setting, Settings, SliderSetting, SwitchSetting } from "./data";
import { ICONS } from "./icons";
import { changeSetting, type Store } from "./state";

export interface Control {
  element: HTMLElement;
  /** Brings the control in line with the state, without emitting a change. */
  apply: (state: Settings) => void;
}

let radioGroups = 0;

const buildSwitch = (store: Store, setting: SwitchSetting): Control => {
  const control = createSwitch({
    label: setting.label,
    checked: store.get()[setting.key],
    supportingText: setting.supportingText,
  });
  control.on("change", ({ checked }) => changeSetting(store, setting.key, checked));
  return {
    element: control.element,
    apply: (state) => {
      control.setValue(state[setting.key]);
      if (setting.disabledWhen?.(state)) control.disable();
      else control.enable();
    },
  };
};

// Radios take no label of their own (the group carries aria-labelledby instead), so the
// field brings its own visible label and names the group with it.
const buildRadios = (store: Store, setting: RadiosSetting): Control => {
  const control = createRadios({
    name: `settings-${setting.key}-${++radioGroups}`,
    options: setting.options,
    value: store.get()[setting.key],
  });
  const field = document.createElement("div");
  field.className = "settings-app__field";
  const label = document.createElement("p");
  label.className = "settings-app__field-label";
  label.id = `settings-${setting.key}-label`;
  label.textContent = setting.label;
  control.element.setAttribute("aria-labelledby", label.id);
  control.on("change", ({ value }) => {
    if (value !== null) changeSetting(store, setting.key, value);
  });
  field.append(label, control.element);
  return { element: field, apply: (state) => control.setValue(state[setting.key]) };
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
  return { element: control.element, apply: (state) => control.setValue(state[setting.key]) };
};

export const buildControl = (store: Store, setting: Setting): Control => {
  if (setting.kind === "switch") return buildSwitch(store, setting);
  if (setting.kind === "radios") return buildRadios(store, setting);
  return buildSlider(store, setting);
};
