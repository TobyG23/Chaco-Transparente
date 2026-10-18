import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const outRoot = resolve(root, "packages/web/out");
export const firstPartyLicenses = ["LICENSE", "LICENSE-CONTENT.txt"] as const;

export async function verifyFirstPartyLicenses(
  exportRoot: string,
): Promise<void> {
  for (const name of firstPartyLicenses) {
    const expected = await readFile(resolve(root, name));
    const actual = await readFile(resolve(exportRoot, name));
    if (!actual.equals(expected))
      throw new Error(
        `First-party license differs from reviewed source: ${name}`,
      );
  }
  for (const path of [
    "index.html",
    "404.html",
    "404/index.html",
    "_not-found/index.html",
    ...["datos", "fuentes", "metodologia", "proyecto", "estado"].map(
      (page) => `${page}/index.html`,
    ),
  ]) {
    const html = await readFile(resolve(exportRoot, path), "utf8");
    for (const name of firstPartyLicenses) {
      if (!html.includes(`href="/${name}"`))
        throw new Error(`Missing first-party license link: ${path} → ${name}`);
    }
  }
}

if (import.meta.main) {
  const [command, ...extra] = Bun.argv.slice(2);
  if (command !== "generate" || extra.length)
    throw new Error("Usage: bun scripts/first-party-licenses.ts generate");
  for (const name of firstPartyLicenses)
    await writeFile(
      resolve(outRoot, name),
      await readFile(resolve(root, name)),
      {
        flag: "wx",
      },
    );
  await verifyFirstPartyLicenses(outRoot);
  console.log("Generated first-party licenses from reviewed sources");
}
