import { realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { preProcessFile } from "typescript";
import { parse } from "svelte/compiler";

/** The variant first, then its local imported sources in stable path order. */
export async function exampleSources(directory: string, entry: string): Promise<{ name: string; code: string }[]> {
  const dir = await realpath(directory);
  const files = new Map<string, string>();
  const inside = (path: string) => {
    const name = relative(dir, path);
    return name !== ".." && !name.startsWith(`..${sep}`) && !isAbsolute(name);
  };
  async function visit(path: string): Promise<void> {
    path = await realpath(path);
    if (!inside(path) || files.has(path)) return;
    const code = await Bun.file(path).text();
    files.set(path, code);
    let scripts: string[] = [];
    if (extname(path) === ".svelte") {
      const ast = parse(code, { modern: true });
      scripts = [ast.module, ast.instance].flatMap(script => {
        if (!script) return [];
        // Svelte supplies source offsets on its ESTree nodes.
        const content = script.content as typeof script.content & { start: number; end: number };
        return [code.slice(content.start, content.end)];
      });
    } else if (/\.[cm]?[jt]sx?$/.test(path)) {
      scripts = [code];
    }
    for (const script of scripts) {
      for (const { fileName } of preProcessFile(script, true, true).importedFiles) {
        if (!fileName.startsWith("./") && !fileName.startsWith("../")) continue;
        // Outside assets belong to the site/package, not this example's source tabs.
        if (!inside(resolve(dirname(path), fileName))) continue;
        await visit(Bun.resolveSync(fileName, dirname(path)));
      }
    }
  }
  const first = await realpath(resolve(dir, entry));
  await visit(first);
  const helpers = [...files.keys()].filter(path => path !== first).sort();
  return [first, ...helpers].map(path => ({ name: relative(dir, path).split(sep).join("/"), code: files.get(path)! }));
}
