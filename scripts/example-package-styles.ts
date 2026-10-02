import { mkdir } from "node:fs/promises";
import { extname } from "node:path";
import type { ExampleMeta } from "../examples/types";

/** Build public package CSS exports in the example's declared cascade order. */
export async function buildPackageStyles(example: ExampleMeta, directory: string, outdir: string): Promise<void> {
  for (const [index, specifier] of (example.packageStyles ?? []).entries()) {
    try {
      if (!/^(?:@[^/]+\/)?[^./][^/]*(?:\/.*)?$/.test(specifier) || specifier.includes(":")) {
        throw new Error("Expected a package specifier");
      }
      const path = Bun.resolveSync(specifier, directory);
      if (extname(path) !== ".css") throw new Error("The export is not CSS");
      await mkdir(outdir, { recursive: true });
      const result = await Bun.build({
        entrypoints: [path], outdir, target: "browser", minify: true,
        naming: { entry: `package-${index}.[ext]`, asset: "[name]-[hash].[ext]" },
      });
      if (!result.success) throw new AggregateError(result.logs, "CSS bundling failed");
    } catch (cause) {
      throw new Error(`Example ${example.slug}: cannot build package stylesheet "${specifier}".`, { cause });
    }
  }
}
