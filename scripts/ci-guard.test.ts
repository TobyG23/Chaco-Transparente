import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertPublicationBlocked,
  assertSafeExportText,
  assertSafeTrackedPaths,
  checkCi,
} from "./ci-guard";
import { scanExport } from "./export-manifest";
import { generateHeaders } from "./netlify-headers";

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
        "<script>editorial</script>",
      );
    }
    await writeFile(
      join(exportRoot, "index.html"),
      "<script>editorial</script>",
    );
    await writeFile(join(exportRoot, "404.html"), "<script>editorial</script>");
    await writeFile(
      join(exportRoot, "_headers"),
      await generateHeaders(exportRoot),
    );
    await mkdir(join(exportRoot, "_next", "static", "chunks"), {
      recursive: true,
    });
    await writeFile(
      join(exportRoot, "_next", "static", "chunks", "app.js"),
      "// editorial",
    );
    await writeFile(manifestPath, JSON.stringify(await scanExport(exportRoot)));
    expect(await checkCi(exportRoot, manifestPath)).toBe(11);
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
