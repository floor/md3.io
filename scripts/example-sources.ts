import { realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { preProcessFile } from "typescript";
import { parse as parseSvelte } from "svelte/compiler";
import { parse as parseVue } from "vue/compiler-sfc";

// What a reader reads as code: the panel highlights Svelte as XML and everything else
// with the TypeScript grammar. Imported data and assets (a .csv, a .json, an image, a
// .css file) are not source, are not listed, and their imports are not followed. The
// declared variant files (examples/types.ts) are all in this set.
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".svelte", ".vue"]);

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
    const extension = extname(path);
    if (!CODE_EXTENSIONS.has(extension)) return;
    const code = await Bun.file(path).text();
    files.set(path, code);
    let scripts: string[] = [];
    if (extension === ".svelte") {
      const ast = parseSvelte(code, { modern: true });
      scripts = [ast.module, ast.instance].flatMap(script => {
        if (!script) return [];
        // Svelte supplies source offsets on its ESTree nodes.
        const content = script.content as typeof script.content & { start: number; end: number };
        return [code.slice(content.start, content.end)];
      });
    } else if (extension === ".vue") {
      const { descriptor } = parseVue(code, { filename: path });
      scripts = [descriptor.script, descriptor.scriptSetup].flatMap(script => script ? [script.content] : []);
    } else {
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
