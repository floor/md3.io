// The overlay cards' configs: the playground's initial state of each component,
// `components[slug].config(initialComponentState(slug))` in src/shared/components.ts,
// written out here so the overview does not load the playground's whole component
// table. test/catalog.test.ts keeps the two equal. The menu's `opener` is left out:
// the card passes its own.
import type { DialogConfig } from 'material/components/dialog';
import type { MenuConfig } from 'material/components/menu';
import type { SnackbarConfig } from 'material/components/snackbar';
import type { TooltipConfig } from 'material/components/tooltip';
import type { TimePickerConfig } from 'material/components/timepicker';
import bookmark from '../../../icons/bookmark.svg' with { type: 'text' };
import send from '../../../icons/send.svg' with { type: 'text' };
import download from '../../../icons/download.svg' with { type: 'text' };

export const dialogDefaults: DialogConfig = {
  title: 'Save your changes?', subtitle: '', content: '<p>Keep your changes before leaving this view.</p>', ariaLabel: 'Save your changes?',
  size: 'small', animation: 'scale', divider: false, open: false, closeButton: true, closeOnOverlayClick: true, closeOnEscape: true, footerAlignment: 'right',
  buttons: [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Save', variant: 'filled', closeDialog: true }],
};

export const menuDefaults: Omit<MenuConfig, 'opener'> = {
  variant: 'vertical', color: 'standard', position: 'bottom-start', dense: false, closeOnSelect: true,
  items: [
    { id: 'save', text: 'Save', icon: bookmark.trim() },
    { id: 'share', text: 'Share', icon: send.trim() },
    { type: 'divider' },
    { id: 'download', text: 'Download', disabled: false, icon: download.trim() },
  ],
};

export const snackbarDefaults: SnackbarConfig = {
  message: 'Your changes have been saved.', action: 'Undo', closeLabel: 'Dismiss', position: 'center', duration: 'indefinite', dismissible: true,
};

export const tooltipDefaults: TooltipConfig = {
  text: 'Save to favorites', variant: 'default', position: 'bottom', visible: false, showDelay: 300, hideDelay: 100, showOnFocus: true, showOnHover: true,
};

export const timepickerDefaults: TimePickerConfig = {
  type: 'dial', format: '12h', orientation: 'vertical',
  title: 'Select time', value: '09:30', showSeconds: false, minuteStep: 1, name: 'time',
};
