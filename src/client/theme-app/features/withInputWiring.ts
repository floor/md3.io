// User actions → handlers, one direction only.
import type { App } from '../core/foundation';

export const withInputWiring = () => (app: App) => {
  const { ui, source, copy } = app;
  ui.theme.on('change', (event: { value: string }) => source.select(event.value));
  const onShare = () => copy.link();
  ui.share.element.addEventListener('click', onShare);
  const onCopy = ({ hex, role }: { hex: string; role: string }) => copy.hex(hex, role);
  ui.scheme.on('copy', onCopy);
  app.teardown.add(() => {
    ui.share.element.removeEventListener('click', onShare);
  });
  return app;
};
