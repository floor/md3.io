// The app bar card: <m-top-app-bar>, with <m-icon-button> from that card's module.
import 'material/elements/css/top-app-bar';
import { defineTopAppBar } from 'material/elements';
import { define as defineIconButtonCard } from './icon-button';

export const define = (): void => {
  defineIconButtonCard();
  defineTopAppBar();
  // The demo's headline is not the page's title: material renders it as an <h1>, which
  // would give the overview a second page heading (the site's own bar does the same, site.ts).
  // Again a frame later: upgrading a server-rendered bar rebuilds its headline.
  const demote = () => {
    for (const bar of document.querySelectorAll('.catalog-visual--app-bar m-top-app-bar')) {
      bar.shadowRoot?.querySelector('h1')?.setAttribute('role', 'presentation');
    }
  };
  demote();
  requestAnimationFrame(demote);
};
