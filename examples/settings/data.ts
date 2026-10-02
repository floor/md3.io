// The fixture: the settings this app edits and their defaults. Plain data (icon names
// only), so every framework variant can share it and nothing here touches the DOM.
import type { IconName } from "./icons";

export interface Settings {
  // Network & internet
  wifi: boolean;
  bluetooth: boolean;
  airplane: boolean;
  mobileData: boolean;
  // Display
  brightness: number;
  adaptiveBrightness: boolean;
  darkTheme: boolean;
  // Sound
  mediaVolume: number;
  ringVolume: number;
  vibrate: boolean;
  doNotDisturb: boolean;
  // Notifications
  allowNotifications: boolean;
  notificationSounds: boolean;
  // Privacy
  location: boolean;
  usageDiagnostics: boolean;
}

export type SettingsKey = keyof Settings;
export type BooleanKey = { [K in SettingsKey]: Settings[K] extends boolean ? K : never }[SettingsKey];
export type NumberKey = { [K in SettingsKey]: Settings[K] extends number ? K : never }[SettingsKey];

export interface SwitchSetting {
  kind: "switch";
  key: BooleanKey;
  label: string;
  supportingText?: string;
  /** A switch another setting locks, e.g. Wi-Fi while airplane mode is on. */
  disabledWhen?: (state: Settings) => boolean;
}

export interface SliderSetting {
  kind: "slider";
  key: NumberKey;
  label: string;
  min: number;
  max: number;
  step: number;
  icon?: IconName;
  iconAtMin?: IconName;
}

export type Setting = SwitchSetting | SliderSetting;

export interface Group {
  title: string;
  settings: Setting[];
}

export interface Category {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  groups: Group[];
}

export const CATEGORIES: Category[] = [
  {
    id: "network",
    title: "Network & internet",
    icon: "wifi",
    summary: "Wi-Fi, Bluetooth, mobile data",
    groups: [
      {
        title: "Connections",
        settings: [
          { kind: "switch", key: "wifi", label: "Wi-Fi", disabledWhen: (s) => s.airplane },
          { kind: "switch", key: "bluetooth", label: "Bluetooth", disabledWhen: (s) => s.airplane },
          { kind: "switch", key: "airplane", label: "Airplane mode", supportingText: "Turns off Wi-Fi and Bluetooth" },
          { kind: "switch", key: "mobileData", label: "Mobile data" },
        ],
      },
      // A "Mobile network" group with "Preferred network type" (5G / LTE / 3G, one radio
      // per list row, the row selecting it) waits: the library cannot draw that group
      // across list rows — the finding in the design note, section 7.
    ],
  },
  {
    id: "display",
    title: "Display",
    icon: "brightness6",
    summary: "Brightness and theme",
    groups: [
      {
        title: "Screen",
        settings: [
          { kind: "slider", key: "brightness", label: "Brightness", min: 0, max: 100, step: 1, icon: "brightness7", iconAtMin: "brightness5" },
          { kind: "switch", key: "adaptiveBrightness", label: "Adaptive brightness", supportingText: "Adjusts to the light around you" },
        ],
      },
      {
        title: "Appearance",
        settings: [
          // "Dark theme" acts on the app itself: on, the app carries the dark roles for
          // its own subtree (see app.ts).
          { kind: "switch", key: "darkTheme", label: "Dark theme" },
          // "Text size" (Small / Default / Large, one radio per row) waits with the
          // radio finding above.
        ],
      },
    ],
  },
  {
    id: "sound",
    title: "Sound",
    icon: "volumeUp",
    summary: "Volumes, vibration, do not disturb",
    groups: [
      {
        title: "Volume",
        settings: [
          { kind: "slider", key: "mediaVolume", label: "Media volume", min: 0, max: 100, step: 1, icon: "volumeUp", iconAtMin: "volumeOff" },
          { kind: "slider", key: "ringVolume", label: "Ring volume", min: 0, max: 100, step: 1 },
        ],
      },
      {
        title: "Alerts",
        settings: [
          { kind: "switch", key: "vibrate", label: "Vibrate" },
          { kind: "switch", key: "doNotDisturb", label: "Do not disturb", supportingText: "Silences calls and notifications" },
        ],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "notifications",
    summary: "Alerts and notification sounds",
    groups: [
      {
        title: "Alerts",
        settings: [
          { kind: "switch", key: "allowNotifications", label: "Allow notifications" },
          { kind: "switch", key: "notificationSounds", label: "Notification sounds" },
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    icon: "lock",
    summary: "Location and usage data",
    groups: [
      {
        title: "Permissions",
        settings: [
          { kind: "switch", key: "location", label: "Location", supportingText: "Lets apps use your location" },
          { kind: "switch", key: "usageDiagnostics", label: "Usage & diagnostics", supportingText: "Shares usage data to improve the device" },
        ],
      },
    ],
  },
];

export const DEFAULTS: Settings = {
  wifi: true,
  bluetooth: false,
  airplane: false,
  mobileData: true,
  brightness: 60,
  adaptiveBrightness: true,
  darkTheme: false,
  mediaVolume: 40,
  ringVolume: 70,
  vibrate: true,
  doNotDisturb: false,
  allowNotifications: true,
  notificationSounds: true,
  location: true,
  usageDiagnostics: false,
};
