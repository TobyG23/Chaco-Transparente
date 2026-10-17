import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { navigation, pendingDecisions, views } from "../src/content";

const webRoot = resolve(import.meta.dir, "..");
const outRoot = join(webRoot, "out");
const builtTest = existsSync(join(outRoot, "index.html")) ? test : test.skip;
// Run `bun run web:verify` for a mandatory fresh-build gate; a plain test run may skip or inspect an older export.

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(absolute) : [absolute];
    }),
  );
  return nested.flat();
}

builtTest(
  "static export provides all editorial pages and working internal links",
  async () => {
    const files = new Set(await filesUnder(outRoot));
    for (const path of [
      "404.html",
      "404/index.html",
      "_not-found/index.html",
    ]) {
      const html = await readFile(join(outRoot, path), "utf8");
      expect(html).toContain('lang="es-AR"');
      expect(html).toContain("Versión preliminar");
      expect(html).toContain("No encontramos esta página.");
      expect(html).toContain("Volver al inicio");
      expect(html).toContain('href="/"');
      expect(html).toContain("<main");
      expect(html).toContain("<h1");
      expect(html).toContain('href="#contenido"');
      expect(html).not.toContain("This page could not be found");
    }
    for (const { href } of navigation) {
      const page = join(outRoot, href, "index.html");
      expect(files.has(page)).toBe(true);
      const html = await readFile(page, "utf8");
      expect(html).toContain('lang="es-AR"');
      expect(html).toContain("Versión preliminar");
      expect(html).toContain("Proyecto independiente, no oficial");
      expect(html).toContain('name="robots"');
      expect(html).toContain("noindex");
      expect(html).toContain('id="contenido"');
      expect(html).toContain('href="#contenido"');
      expect(html).toContain("<main");
      expect(html).toContain('aria-current="page"');
      for (const [, target] of html.matchAll(
        /\bhref="(\/[^"?#]*)(?:[?#][^"]*)?"/g,
      )) {
        if (target.startsWith("/_next/")) {
          expect(files.has(join(outRoot, target.slice(1)))).toBe(true);
        } else {
          expect(files.has(join(outRoot, target, "index.html"))).toBe(true);
        }
      }
    }
  },
);

builtTest(
  "export contains only editorial content and approved file types",
  async () => {
    const files = await filesUnder(outRoot);
    expect(files.length).toBeGreaterThan(6);
    for (const file of files) {
      const relative = file.slice(outRoot.length + 1).replaceAll("\\", "/");
      expect(relative).not.toMatch(
        /(?:^|\/)(?:data|archive|private|\.env[^/]*)\//i,
      );
      expect(
        relative === "_headers" || /\.(?:html|txt|js|css)$/i.test(relative),
      ).toBe(true);
      const content = await readFile(file, "utf8");
      expect(content).not.toMatch(
        /CHACO_(?:FINALIDAD|OBJETO)_CSV|rawCells|Q_NOMENT|publicationAllowed\s*[:=]\s*true|5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7|300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0/,
      );
    }
    const datos = await readFile(join(outRoot, "datos", "index.html"), "utf8");
    const metodologia = await readFile(
      join(outRoot, "metodologia", "index.html"),
      "utf8",
    );
    const estado = await readFile(
      join(outRoot, "estado", "index.html"),
      "utf8",
    );
    for (const view of views) expect(datos).toContain(view.title);
    for (const decision of pendingDecisions) expect(estado).toContain(decision);
    expect(datos).toContain("No se suman entre sí");
    expect(metodologia).toContain("Q_PAG no se presenta");
    expect(estado).toContain("publicationAllowed=false");
  },
);
