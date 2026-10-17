import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const lock = Bun.JSONC.parse(
  await readFile(resolve(root, "bun.lock"), "utf8"),
) as {
  packages: Record<string, [string, ...unknown[]]>;
};

const rows = await Promise.all(
  Object.entries(lock.packages)
    .filter(([name]) => !name.startsWith("@chaco/"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(async ([name, [version]]) => {
      const packageName = version.slice(0, version.lastIndexOf("@"));
      const storeName = `${packageName.replaceAll("/", "+")}@${version.slice(version.lastIndexOf("@") + 1)}`;
      const packageRoot = resolve(
        root,
        "node_modules",
        ".bun",
        storeName,
        "node_modules",
        packageName,
      );
      let license = "NOT INSTALLED / NOT VERIFIED";
      let notice = "not checked";
      for (const location of [
        packageRoot,
        resolve(root, "packages/web/node_modules", packageName),
        resolve(root, "node_modules", packageName),
      ]) {
        try {
          const installed = JSON.parse(
            await readFile(resolve(location, "package.json"), "utf8"),
          ) as {
            name: string;
            version: string;
            license?: string;
            licenses?: unknown;
          };
          if (`${installed.name}@${installed.version}` !== version) continue;
          license =
            installed.license ??
            (installed.licenses ? "see package" : "UNDECLARED");
          notice = "inspect package license/notice files for obligations";
          break;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      return { name, version, license, notice };
    }),
);

console.log(
  JSON.stringify({ lockfile: "bun.lock", count: rows.length, rows }, null, 2),
);
