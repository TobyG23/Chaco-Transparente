import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { assertBundledEvidence, renderNotices } from "./third-party-notices";

const polyfill = resolve(
  import.meta.dir,
  "../packages/web/node_modules/next/dist/build/polyfills/polyfill-nomodule.js",
);

test("notices contain the four original complete license texts in stable order", async () => {
  const first = await renderNotices();
  expect(await renderNotices()).toBe(first);
  for (const name of [
    "next-16.4.2.LICENSE",
    "react-family.LICENSE",
    "core-js-3.38.1.LICENSE",
    "tailwindcss-4.3.3.LICENSE",
    "process-browser.LICENSE",
  ]) {
    const original = await readFile(
      resolve(import.meta.dir, "notices", name),
      "utf8",
    );
    expect(first).toContain(original.trimEnd());
  }
  expect(first).toContain("Copyright (c) Tailwind Labs, Inc.");
});

test("bundled evidence rejects changed polyfill, React markers and stylesheet", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-notices-test-"));
  const chunks = join(root, "_next", "static", "chunks");
  try {
    await mkdir(chunks, { recursive: true });
    const polyfillPath = join(chunks, "polyfill.js");
    const appPath = join(chunks, "app.js");
    const cssPath = join(chunks, "app.css");
    const app =
      '19.3.0-canary-278794d7-20261002 rendererPackageName:"react-dom" process.binding is not supported process.chdir is not supported';
    const css =
      "@layer theme,base,utilities;@layer theme{--tw-color:test}@layer utilities{}";
    await writeFile(polyfillPath, await readFile(polyfill));
    await writeFile(appPath, app);
    await writeFile(cssPath, css);
    await writeFile(join(chunks, "debt.css"), ".debt{color:teal}");
    await expect(assertBundledEvidence(root)).resolves.toBeUndefined();
    await writeFile(join(chunks, "debt.css"), css);
    expect(assertBundledEvidence(root)).rejects.toThrow(
      "Tailwind CSS evidence changed",
    );
    await writeFile(join(chunks, "debt.css"), ".debt{color:teal}");
    await writeFile(polyfillPath, "different");
    expect(assertBundledEvidence(root)).rejects.toThrow("evidence changed");
    await writeFile(polyfillPath, await readFile(polyfill));
    await writeFile(appPath, "unreviewed renderer");
    expect(assertBundledEvidence(root)).rejects.toThrow("evidence changed");
    await writeFile(appPath, app);
    await writeFile(cssPath, "body{}");
    expect(assertBundledEvidence(root)).rejects.toThrow(
      "Tailwind CSS evidence changed",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
