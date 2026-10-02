// User actions → handlers, one direction only.
import type { App } from '../core/foundation';

export const withInputWiring = () => (app: App) => {
  const { ui, source, copy, state } = app;
  ui.theme.on('change', (event: { value: string }) => source.select(event.value));
  const onMode = () => source.setMode(state.get('mode') === 'dark' ? 'light' : 'dark');
  const onShare = () => copy.link();
  ui.mode.element.addEventListener('click', onMode);
  ui.share.element.addEventListener('click', onShare);
  const onCopy = ({ hex, role }: { hex: string; role: string }) => copy.hex(hex, role);
  ui.light.on('copy', onCopy);
  ui.dark.on('copy', onCopy);
  app.teardown.add(() => {
    ui.mode.element.removeEventListener('click', onMode);
    ui.share.element.removeEventListener('click', onShare);
  });
  return app;
};
