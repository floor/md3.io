// The Styles section's pages: the sidebar, the routes and the search index read this list.
export const stylePages = [
  { href: '/styles/', name: 'Overview', title: 'Styles', description: 'Shape your own Material: tune mtrl’s tokens, watch real components follow, and export one theme.' },
  { href: '/styles/themes/', name: 'Themes', title: 'Themes', description: 'mtrl’s built-in themes: every color role of the light and dark scheme, and the tonal palettes they come from.' },
  { href: '/styles/color/', name: 'Color', title: 'Color', description: 'Every mtrl color role in each theme, light and dark, with its CSS variable and contrast.' },
  { href: '/styles/typography/', name: 'Typography', title: 'Typography', description: 'The 15 roles of the Material 3 type scale as mtrl ships them, with live samples.' },
  { href: '/styles/shape/', name: 'Shape', title: 'Shape', description: 'The Material 3 corner scale as mtrl ships it: make your components squarer or rounder and watch them follow.' },
] as const;

/** Styles pages still to come: shown on the overview, disabled. */
export const comingStyles = [
  { name: 'Elevation', summary: 'Shadow levels and tonal surfaces.' },
  { name: 'Motion', summary: 'Easing and duration tokens.' },
  { name: 'States', summary: 'Hover, focus, pressed and dragged layers.' },
  { name: 'Icons', summary: 'Material Symbols in mtrl components.' },
] as const;
