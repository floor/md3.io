import listStyles from 'vlist/styles' with { type: 'text' };
import tableStyles from 'vlist/styles/table' with { type: 'text' };

// The shared examples build writes only JS. Keep the public, unmodified vendor
// styles with this bundle; own layout lives in styles.css. No DOM work at import.
// A mount owns this stylesheet link and URL, and releases both at teardown.
export function mountListStyles(): () => void {
  const url = URL.createObjectURL(new Blob([listStyles, tableStyles], { type: 'text/css' }));
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = url;
  document.head.append(link);
  return () => { link.remove(); URL.revokeObjectURL(url); };
}
