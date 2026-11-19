// The state every variant of this example shares, and how it is described.
// check.ts drives it, and check-examples compares what each framework shows.
export interface Notify {
  notify: boolean;
}

export const DEFAULTS: Notify = { notify: false };

const on = (value: boolean): string => (value ? "on" : "off");

export const summary = (s: Notify): string => `Notifications are ${on(s.notify)}.`;
