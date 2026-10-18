import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  navigation,
  pendingDecisions,
  resourcePages,
  views,
} from "../src/content";

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
      if (process.env.CHACO_FRESH_EXPORT === "1")
        for (const license of [
          "LICENSE",
          "LICENSE-CONTENT.txt",
          "third-party-notices.txt",
        ])
          expect(html).toContain(`href="/${license}"`);
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
      if (process.env.CHACO_FRESH_EXPORT === "1")
        for (const license of [
          "LICENSE",
          "LICENSE-CONTENT.txt",
          "third-party-notices.txt",
        ])
          expect(html).toContain(`href="/${license}"`);
      for (const [, target] of html.matchAll(
        /\bhref="(\/[^"?#]*)(?:[?#][^"]*)?"/g,
      )) {
        if (
          target.startsWith("/_next/") ||
          [
            "/LICENSE",
            "/LICENSE-CONTENT.txt",
            "/third-party-notices.txt",
          ].includes(target)
        ) {
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
        relative === "_headers" ||
          relative === "LICENSE" ||
          /\.(?:html|txt|js|css)$/i.test(relative),
      ).toBe(true);
      const content = await readFile(file, "utf8");
      expect(content).not.toMatch(
        /CHACO_(?:FINALIDAD|OBJETO)_CSV|rawCells|Q_NOMENT|publicationAllowed\s*[:=]\s*true|5ecf7a89a9df8c8a4d4cc1b44464cf6cf4f46108634faedc4639c794679cdab7|300bd7ce059bf22c94cbbe793326eac04153b93467841a75302828d21b43b5e0/,
      );
    }
    const cssFiles = files.filter((file) => file.endsWith(".css"));
    expect(cssFiles).toHaveLength(1);
    const css = await readFile(cssFiles[0], "utf8");
    expect(css).toMatch(/\.status-strip a:focus-visible[^}]*outline-color:/);
    expect(css).toMatch(/\.site-footer a:focus-visible[^}]*outline-color:/);
    const datos = await readFile(join(outRoot, "datos", "index.html"), "utf8");
    const metodologia = await readFile(
      join(outRoot, "metodologia", "index.html"),
      "utf8",
    );
    const estado = await readFile(
      join(outRoot, "estado", "index.html"),
      "utf8",
    );
    const fuentes = await readFile(
      join(outRoot, "fuentes", "index.html"),
      "utf8",
    );
    const proyecto = await readFile(
      join(outRoot, "proyecto", "index.html"),
      "utf8",
    );
    if (process.env.CHACO_FRESH_EXPORT === "1") {
      for (const resource of resourcePages) {
        expect(fuentes).toContain(resource.title);
        expect(fuentes).toContain(resource.href);
      }
      expect(fuentes).not.toMatch(/\/download\/|\.csv(?:["?])/i);
      expect(proyecto).toContain('id="privacidad"');
      expect(proyecto).toContain(
        "no es todavía un aviso de privacidad aprobado",
      );
      const notices = await readFile(
        join(outRoot, "third-party-notices.txt"),
        "utf8",
      );
      expect(notices).toContain("core-js 3.38.1");
      expect(notices).toContain("React DOM");
      expect(notices).toContain("Tailwind CSS 4.3.3");
      expect(notices).toContain("Copyright (c) 2014-2024 Denis Pushkarev");
      const codeLicense = await readFile(join(outRoot, "LICENSE"), "utf8");
      const contentLicense = await readFile(
        join(outRoot, "LICENSE-CONTENT.txt"),
        "utf8",
      );
      expect(codeLicense).toContain(
        "Copyright (c) 2026 Chaco Transparente contributors",
      );
      expect(contentLicense).toContain(
        "https://creativecommons.org/licenses/by/4.0/legalcode",
      );
    }
    for (const view of views) expect(datos).toContain(view.title);
    for (const decision of pendingDecisions) expect(estado).toContain(decision);
    expect(datos).toContain("No se suman entre sí");
    expect(metodologia).toContain("Q_PAG no se presenta");
    expect(estado).toContain("publicationAllowed=false");
  },
);
