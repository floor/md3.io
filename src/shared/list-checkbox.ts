// The task list's trailing checkbox (component-properties.ts and catalog/list.ts): material's own
// <m-checkbox>, shown in the item's icon slot, which is hidden from assistive technology; the row's
// selection is the state people and screen readers act on.
export const checkboxMark = (checked: boolean): string =>
  `<m-checkbox class="property-tasks__check"${checked ? ' checked' : ''} tabindex="-1" aria-hidden="true"></m-checkbox>`;
