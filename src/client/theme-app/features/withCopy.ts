// Copying, told by mtrl's snackbar: a role's hex, or a link to the theme. `tell` is
// the app's snackbar for anything else.
import createSnackbar, { clearSnackbars } from 'mtrl/components/snackbar';
import type { App } from '../core/foundation';

export const withCopy = () => (app: App) => {
  app.teardown.add(() => clearSnackbars());
  const tell = (message: string) => createSnackbar({ message, duration: 2000, queueBehavior: 'replace', position: 'center' }).show();
  const write = async (text: string): Promise<boolean> => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };
  return {
    ...app,
    copy: {
      tell,
      hex: async (hex: string, role: string) => tell(await write(hex) ? `Copied ${hex}` : `Could not copy ${hex} (${role})`),
      link: async () => {
        const url = new URL('/styles/themes/', location.origin);
        const { seed, name } = app.source.current();
        url.searchParams.set(seed ? 'seed' : 'theme', seed ? seed.slice(1) : name);
        tell(await write(url.href) ? 'Link copied' : `Could not copy ${url.href}`);
      },
    },
  };
};
