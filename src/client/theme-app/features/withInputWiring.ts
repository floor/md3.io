// User actions → handlers, one direction only.
import type { App } from '../core/foundation';

export const withInputWiring = () => (app: App) => {
  const { ui, source, copy, image, element } = app;
  ui.theme.on('change', (event: { value: string }) => source.select(event.value));
  const onShare = () => copy.link();
  const onCopy = ({ hex, role }: { hex: string; role: string }) => copy.hex(hex, role);
  ui.scheme.on('copy', onCopy);
  // An image: from the picker, or dropped anywhere on the app.
  const onPick = () => ui.file.click();
  const onFile = () => { const file = ui.file.files?.[0]; ui.file.value = ''; if (file) image.load(file); };
  const onDragOver = (event: DragEvent) => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); element.dataset.dropping = ''; } };
  const onDragLeave = (event: DragEvent) => { if (!element.contains(event.relatedTarget as Node)) delete element.dataset.dropping; };
  const onDrop = (event: DragEvent) => {
    const file = event.dataTransfer?.files[0];
    delete element.dataset.dropping;
    if (!file) return;
    event.preventDefault();
    image.load(file);
  };
  const listeners: [EventTarget, string, EventListener][] = [
    [ui.share.element, 'click', onShare], [ui.image.element, 'click', onPick], [ui.file, 'change', onFile],
    [element, 'dragover', onDragOver as EventListener], [element, 'dragleave', onDragLeave as EventListener], [element, 'drop', onDrop as EventListener],
  ];
  for (const [target, type, listener] of listeners) target.addEventListener(type, listener);
  app.teardown.add(() => { for (const [target, type, listener] of listeners) target.removeEventListener(type, listener); });
  return app;
};
