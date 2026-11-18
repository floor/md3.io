// A page-specific entry; image quantization stays in a lazy chunk until requested.
import { createColourLab } from './colour-lab/app';
const root = document.querySelector<HTMLElement>('#colour-lab');
if (root) {
  const app = createColourLab(root);
  window.addEventListener('pagehide', event => { if (!event.persisted) app.destroy(); });
}
