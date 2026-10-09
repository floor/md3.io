// Which playgrounds mount the real `<m-*>` element behind `?stage=elements`.
// One table, not a branch per component: the events the factory stage already
// reports, and the host the stage stylesheet has to name because a custom
// element is inline. Slider stays here too; its centred value and its vertical
// length are the special cases the mount applies when `vertical` is set.
export type StageListen = 'click' | 'selected' | 'checked' | 'slider';

export type StageCall = { when: 'lowered' | 'collapsed'; method: 'lower' | 'collapse' };

export type ElementStage = {
  /** Events the element dispatches that the factory stage already turns into sync and message. */
  listen: readonly StageListen[];
  /** The noun in the selected and deselected messages. Button and icon button only. */
  selectedLabel?: 'Button' | 'Icon button';
  /** Methods the factory stage calls after create. The element has no attribute for them. */
  calls?: readonly StageCall[];
  /** The host selector the stage stylesheet sizes. Absent when the factory's wrapper is the box. */
  host?: string;
  /** Divider only: the factory stage's flex frame, because a bare divider has no length. */
  wrap?: 'divider';
  /** Slider only: the centred shift and the vertical length are not in the element plan. */
  vertical?: true;
};

export const elementStage = {
  button: { listen: ['click', 'selected'], selectedLabel: 'Button', host: 'm-button' },
  'icon-button': { listen: ['click', 'selected'], selectedLabel: 'Icon button', host: 'm-icon-button' },
  switch: { listen: ['checked'], host: 'm-switch' },
  fab: { listen: ['click'], calls: [{ when: 'lowered', method: 'lower' }], host: 'm-fab' },
  'extended-fab': {
    listen: ['click'],
    calls: [{ when: 'collapsed', method: 'collapse' }, { when: 'lowered', method: 'lower' }],
    host: 'm-extended-fab',
  },
  progress: { listen: [], host: 'm-progress' },
  'loading-indicator': { listen: [], host: 'm-loading-indicator' },
  divider: { listen: [], wrap: 'divider' },
  slider: { listen: ['slider'], host: 'm-slider', vertical: true },
} as const satisfies Record<string, ElementStage>;

export type ElementStageSlug = keyof typeof elementStage;

export const isElementStage = (slug: string): slug is ElementStageSlug => slug in elementStage;

/** The flex frame the factory stage already builds around a divider. */
export const dividerFrame = (orientation: unknown): string =>
  `display:flex;align-items:center;width:100%;max-width:400px;flex-direction:${orientation === 'vertical' ? 'column' : 'row'};${orientation === 'vertical' ? 'height:200px;' : ''}`;

/** The state the preview's first HTML was rendered from: the named scenario, or the default. */
export const stageRequestState = <T extends Record<string, unknown>>(
  base: T,
  scenario: { options: Partial<T> } | undefined,
): T => scenario ? { ...base, ...scenario.options } : base;
