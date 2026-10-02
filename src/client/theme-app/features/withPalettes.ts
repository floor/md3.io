// The tonal palettes of the scheme shown, and a line on where they come from.
import type { App } from '../core/foundation';
import { PALETTES } from '../config/layout';

export const withPalettes = () => (app: App) => ({
  ...app,
  palettes: {
    paint: () => {
      const theme = app.variant.shown();
      const { variant, contrast } = app.variant.effective();
      app.ui.paletteNote.textContent = theme.handSeed && variant === 'original' && contrast === 0
        ? `Original colours set by hand; variants generated from ${theme.handSeed}. These palettes are Tonal Spot's from it.`
        : `Generated from ${theme.origin}.`;
      for (const [key] of PALETTES) app.ui[`palette-${key}`].set(theme.palettes[key]);
    },
  },
});
