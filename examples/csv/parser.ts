/** Strict CSV: preserve cell text; reject ambiguous quoting and ragged records. */
export function parseCSV(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  if (!text.length) throw new Error('The file is empty. Include a header row.');
  const records: string[][] = [];
  let row: string[] = [], value = '', quoted = false, closed = false;
  const fail = (at: number): never => { throw new Error(`Invalid quote at character ${at + 1}, record ${records.length + 1}.`); };
  const cell = () => { row.push(value); value = ''; closed = false; };
  const record = () => { cell(); records.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') value += c;
      else if (text[i + 1] === '"') { value += '"'; i++; }
      else { quoted = false; closed = true; }
    } else if (c === ',') cell();
    else if (c === '\r' || c === '\n') {
      record();
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else if (c === '"') {
      if (value || closed) fail(i);
      quoted = true;
    } else {
      if (closed) fail(i);
      value += c;
    }
  }
  if (quoted) throw new Error(`Unclosed quote in record ${records.length + 1}.`);
  if (row.length || value || closed || !/[\r\n]$/.test(text)) record();
  const width = records[0].length;
  records.forEach((r, i) => {
    if (r.length !== width) throw new Error(`Record ${i + 1} has ${r.length} fields; expected ${width}.`);
  });
  return records;
}

export function writeCSV(records: string[][]): string {
  const quote = (s: string) => /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  return '\uFEFF' + records.map(r => r.map(quote).join(',')).join('\r\n') + '\r\n';
}
