// The state every variant of this example shares, and how it is described.
export interface Settings {
  tab: string;
  wifi: boolean;
  bluetooth: boolean;
  airplane: boolean;
  notifications: boolean;
  sounds: boolean;
}

export const DEFAULTS: Settings = {
  tab: "connectivity",
  wifi: true,
  bluetooth: false,
  airplane: false,
  notifications: true,
  sounds: false,
};

const on = (value: boolean): string => (value ? "on" : "off");

export const summary = (s: Settings): string =>
  `Saved: Wi-Fi ${on(s.wifi)}, Bluetooth ${on(s.bluetooth)}, airplane mode ${on(s.airplane)}, ` +
  `notifications ${on(s.notifications)}, sounds ${on(s.sounds)}.`;
