import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assertPublicationBlocked,
  assertSafeExportText,
  assertSafeTrackedPaths,
  checkCi,
} from "./ci-guard";
import { scanExport } from "./export-manifest";
import { generateHeaders } from "./netlify-headers";
import { renderNotices } from "./third-party-notices";

test("publication contracts must each remain exactly false", () => {
  const contract = "publicationAllowed: false;\nisPublished: false;";
  expect(() => assertPublicationBlocked(contract)).not.toThrow();
  for (const changed of [
    "publicationAllowed: true;\nisPublished: false;",
    "publicationAllowed: false;\nisPublished: true;",
    "publicationAllowed: false;\npublicationAllowed: true;\nisPublished: false;",
    "publicationAllowed: false;",
  ]) {
    expect(() => assertPublicationBlocked(changed)).toThrow();
  }
});

test("tracked paths exclude private files and original or derived data", () => {
  expect(() =>
    assertSafeTrackedPaths([".env.example", "packages/web/app/page.tsx"]),
  ).not.toThrow();
  for (const path of [
    "data/original.csv",
    "packages/web/out/index.html",
    "private/notes.txt",
    ".env.production",
    "secret.pem",
    "exports/report.csv",
  ]) {
    expect(() => assertSafeTrackedPaths([path])).toThrow();
  }
});

test("downloaded export must match its manifest before use", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "chaco-ci-guard-"));
  const exportRoot = join(temporary, "export");
  const manifestPath = join(temporary, "manifest.json");
  try {
    await mkdir(exportRoot);
    for (const page of [
      "404",
      "_not-found",
      "datos",
      "fuentes",
      "metodologia",
      "proyecto",
      "estado",
    ]) {
      await mkdir(join(exportRoot, page));
      await writeFile(
        join(exportRoot, page, "index.html"),
        '<script>editorial</script><a href="/third-party-notices.txt">Notices</a>',
      );
    }
    await writeFile(
      join(exportRoot, "index.html"),
      '<script>editorial</script><a href="/third-party-notices.txt">Notices</a>',
    );
    await writeFile(
      join(exportRoot, "404.html"),
      '<script>editorial</script><a href="/third-party-notices.txt">Notices</a>',
    );
    await writeFile(
      join(exportRoot, "third-party-notices.txt"),
      await renderNotices(),
    );
    await writeFile(
      join(exportRoot, "_headers"),
      await generateHeaders(exportRoot),
    );
    await mkdir(join(exportRoot, "_next", "static", "chunks"), {
      recursive: true,
    });
    const polyfill = resolve(
      import.meta.dir,
      "../packages/web/node_modules/next/dist/build/polyfills/polyfill-nomodule.js",
    );
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "polyfill.js"),
      await readFile(polyfill),
    );
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "app.js"),
      '19.3.0-canary-278794d7-20261002 rendererPackageName:"react-dom" process.binding is not supported process.chdir is not supported',
    );
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "app.css"),
      "@layer theme,base,utilities;@layer theme{--tw-color:test}@layer utilities{}",
    );
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(await checkCi(exportRoot, manifestPath)).toBe(14);
    const noticePath = join(exportRoot, "third-party-notices.txt");
    await writeFile(noticePath, "altered notice");
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(checkCi(exportRoot, manifestPath)).rejects.toThrow("notices differ");
    await writeFile(noticePath, await renderNotices());
    await writeFile(
      join(exportRoot, "index.html"),
      "<main>missing link</main>",
    );
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(checkCi(exportRoot, manifestPath)).rejects.toThrow(
      "Missing third-party notices link",
    );
    await writeFile(
      join(exportRoot, "index.html"),
      '<script>editorial</script><a href="/third-party-notices.txt">Notices</a>',
    );
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "app.js"),
      "unknown",
    );
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(checkCi(exportRoot, manifestPath)).rejects.toThrow(
      "Bundled polyfill, React DOM or process evidence changed",
    );
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "app.js"),
      '19.3.0-canary-278794d7-20261002 rendererPackageName:"react-dom" process.binding is not supported process.chdir is not supported',
    );
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(await checkCi(exportRoot, manifestPath)).toBe(14);
    await writeFile(join(exportRoot, "_headers"), "/\n");
    expect(checkCi(exportRoot, manifestPath)).rejects.toThrow("differs");
    await writeFile(
      join(exportRoot, "_headers"),
      await generateHeaders(exportRoot),
    );
    await writeFile(join(exportRoot, "index.html"), "different!");
    expect(checkCi(exportRoot, manifestPath)).rejects.toThrow("differs");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("export text rejects known data and credential markers", () => {
  expect(() =>
    assertSafeExportText(
      "index.html",
      "Proyecto independiente; sin importes publicados.",
    ),
  ).not.toThrow();
  for (const text of [
    "rawCells",
    "isPublished: true",
    "CHACO_FINALIDAD_CSV",
    "-----BEGIN PRIVATE KEY-----",
  ]) {
    expect(() => assertSafeExportText("index.html", text)).toThrow();
  }
});
