// A page-specific entry; image quantization stays lazy until requested.
import { createColourLab } from './colour-lab/app';
import { registerPage } from './page-lifecycle';
registerPage('colour-lab', (content, life) => {
  const root = content.querySelector<HTMLElement>('#colour-lab');
  if (root) {
    const app = createColourLab(root);
    life.add(() => app.destroy());
    life.events(window).addEventListener('pagehide', event => { if (!event.persisted) app.destroy(); });
  }
});
