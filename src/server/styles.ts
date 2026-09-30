// The Styles section's pages: the sidebar, the routes and the search index read this list.
export const stylePages = [
  { href: '/styles/', name: 'Overview', title: 'Styles', description: 'The design tokens behind mtrl components: color and typography, read from mtrl itself.' },
  { href: '/styles/color/', name: 'Color', title: 'Color', description: 'Every mtrl color role in each theme, light and dark, with its CSS variable and contrast.' },
  { href: '/styles/typography/', name: 'Typography', title: 'Typography', description: 'The 15 roles of the Material 3 type scale as mtrl ships them, with live samples.' },
] as const;

/** Styles pages still to come: shown on the overview, disabled. */
export const comingStyles = [
  { name: 'Elevation', summary: 'Shadow levels and tonal surfaces.' },
  { name: 'Shape', summary: 'The corner radius scale.' },
  { name: 'Motion', summary: 'Easing and duration tokens.' },
  { name: 'States', summary: 'Hover, focus, pressed and dragged layers.' },
  { name: 'Icons', summary: 'Material Symbols in mtrl components.' },
] as const;
