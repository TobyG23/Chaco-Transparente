import { afterEach, expect, test } from "bun:test";
import {
  link,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readApprovedManifest,
  scanExport,
  validateManifest,
  verifyExport,
} from "./export-manifest";

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "chaco-export-test-"));
  roots.push(root);
  for (const page of [
    "datos",
    "fuentes",
    "metodologia",
    "proyecto",
    "estado",
    "404",
    "_not-found",
  ]) {
    await mkdir(join(root, page));
    await writeFile(join(root, page, "index.html"), `<h1>${page}</h1>`);
  }
  await writeFile(join(root, "index.html"), "<h1>inicio</h1>");
  await writeFile(join(root, "404.html"), "<h1>404</h1>");
  return root;
}

test("inventories exact bytes deterministically and verifies manifest schema", async () => {
  const root = await fixture();
  await writeFile(join(root, "index.txt"), "á");
  const first = await scanExport(root);
  expect(await scanExport(root)).toEqual(first);
  expect(first.files.find((file) => file.path === "index.txt")?.bytes).toBe(2);
  expect(validateManifest(first)).toEqual(first);
  expect(
    await verifyExport(root, {
      format: first.format,
      files: first.files.map(({ path, bytes, sha256 }) => ({
        sha256,
        bytes,
        path,
      })),
    }),
  ).toBe(first.files.length);
});

test("includes only the root Netlify headers file in the manifest", async () => {
  const root = await fixture();
  await writeFile(
    join(root, "_headers"),
    "/\n  X-Content-Type-Options: nosniff\n",
  );
  const approved = await scanExport(root);
  expect(approved.files.some((file) => file.path === "_headers")).toBe(true);
  await writeFile(
    join(root, "_headers"),
    "/\n  X-Content-Type-Options: altered\n",
  );
  expect(verifyExport(root, approved)).rejects.toThrow("Export differs");
  await writeFile(join(root, "datos", "_headers"), "unexpected");
  expect(scanExport(root)).rejects.toThrow("Unexpected export path");
});

test("includes only the reviewed third-party notices path and detects alteration", async () => {
  const root = await fixture();
  const notice = join(root, "third-party-notices.txt");
  await writeFile(notice, "reviewed notices");
  const approved = await scanExport(root);
  expect(
    approved.files.some((file) => file.path === "third-party-notices.txt"),
  ).toBe(true);
  await writeFile(notice, "changed notices");
  expect(verifyExport(root, approved)).rejects.toThrow("Export differs");
  await writeFile(join(root, "other-notices.txt"), "unreviewed");
  expect(scanExport(root)).rejects.toThrow("Unexpected export path");
});

test("permits only exact first-party license names and detects altered bytes", async () => {
  const root = await fixture();
  await writeFile(join(root, "LICENSE"), "MIT text");
  await writeFile(join(root, "LICENSE-CONTENT.txt"), "CC BY text");
  const approved = await scanExport(root);
  expect(approved.files.some((file) => file.path === "LICENSE")).toBe(true);
  expect(
    approved.files.some((file) => file.path === "LICENSE-CONTENT.txt"),
  ).toBe(true);
  await writeFile(join(root, "LICENSE"), "changed");
  expect(verifyExport(root, approved)).rejects.toThrow("Export differs");
  await writeFile(join(root, "LICENSE-EXTRA.txt"), "unexpected");
  expect(scanExport(root)).rejects.toThrow("Unexpected export path");
});

test("rejects unexpected assets and changed hashes", async () => {
  const root = await fixture();
  const before = await scanExport(root);
  await writeFile(join(root, "index.html"), "changed");
  expect((await scanExport(root)).files).not.toEqual(before.files);
  await writeFile(join(root, "secret.csv"), "synthetic-only");
  expect(scanExport(root)).rejects.toThrow("Unexpected export path");
});

test("detects added, removed, changed-size and same-size files", async () => {
  const root = await fixture();
  const baseline = await scanExport(root);
  expect(await verifyExport(root, baseline)).toBe(baseline.files.length);
  await writeFile(join(root, "index.txt"), "new");
  expect(verifyExport(root, baseline)).rejects.toThrow("Export differs");
  await unlink(join(root, "index.txt"));
  await unlink(join(root, "datos", "index.html"));
  expect(verifyExport(root, baseline)).rejects.toThrow(
    "missing an editorial HTML route",
  );
  await writeFile(join(root, "datos", "index.html"), "<h1>datos</h1>");
  await writeFile(join(root, "index.html"), "different length");
  expect(verifyExport(root, baseline)).rejects.toThrow("Export differs");
  await writeFile(join(root, "index.html"), "<h1>other!</h1>");
  expect(verifyExport(root, baseline)).rejects.toThrow("Export differs");
  await writeFile(join(root, "index.html"), "<h1>inicio</h1>");
  await writeFile(join(root, "index.txt"), "new");
  const withFile = await scanExport(root);
  await unlink(join(root, "index.txt"));
  expect(verifyExport(root, withFile)).rejects.toThrow("Export differs");
});

test("rejects empty trees and unexpected empty directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-empty-test-"));
  roots.push(root);
  expect(scanExport(root)).rejects.toThrow("missing an editorial HTML route");
  const valid = await fixture();
  await mkdir(join(valid, "private"));
  expect(scanExport(valid)).rejects.toThrow("Unexpected export directory");
});

test("rejects hard links to an external file", async () => {
  const root = await fixture();
  const external = await mkdtemp(join(tmpdir(), "chaco-external-test-"));
  roots.push(external);
  const source = join(external, "source.txt");
  await writeFile(source, "synthetic");
  await link(source, join(root, "index.txt"));
  expect(scanExport(root)).rejects.toThrow(
    "Export file changed during inspection",
  );
});

test("rejects a linked directory, including links to an otherwise allowed route", async () => {
  const root = await fixture();
  await mkdir(join(root, "_next"));
  await symlink(join(root, "datos"), join(root, "_next", "linked"), "junction");
  expect(scanExport(root)).rejects.toThrow(
    /Link or special file|Link or junction/,
  );
});

test("rejects a linked file when Windows permits creating it, and a removed file", async () => {
  const root = await fixture();
  await mkdir(join(root, "_next"));
  await mkdir(join(root, "_next", "static"));
  await mkdir(join(root, "_next", "static", "chunks"));
  try {
    await symlink(
      join(root, "index.html"),
      join(root, "_next", "static", "chunks", "linked.js"),
      "file",
    );
    expect(scanExport(root)).rejects.toThrow(
      /Link or special file|Link or junction/,
    );
    await unlink(join(root, "_next", "static", "chunks", "linked.js"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error;
    console.warn(
      "Windows denied file symlink creation; linked-file check skipped",
    );
  }
  await unlink(join(root, "index.html"));
  expect(scanExport(root)).rejects.toThrow("missing an editorial HTML route");
});

test("reads external manifest and rejects one inside export or corrupt JSON", async () => {
  const root = await fixture();
  const external = await mkdtemp(join(tmpdir(), "chaco-manifest-test-"));
  roots.push(external);
  const outside = join(external, "manifest.json");
  const inside = join(root, "manifest.json");
  const inventory = await scanExport(root);
  await writeFile(outside, JSON.stringify(inventory));
  expect(await readApprovedManifest(root, outside)).toEqual(inventory);
  await writeFile(inside, JSON.stringify(inventory));
  expect(readApprovedManifest(root, inside)).rejects.toThrow(
    "outside the export",
  );
  await writeFile(outside, "{");
  expect(readApprovedManifest(root, outside)).rejects.toThrow();
});

test("rejects absolute and traversing paths, corrupt hashes and unsorted entries", () => {
  expect(() =>
    validateManifest({
      format: "chaco-static-export-v1",
      files: [{ path: "../secret.txt", bytes: 1, sha256: "a".repeat(64) }],
    }),
  ).toThrow();
  for (const path of [
    "/index.html",
    "C:/index.html",
    "datos/../index.html",
    "\\\\server\\share\\index.html",
  ]) {
    expect(() =>
      validateManifest({
        format: "chaco-static-export-v1",
        files: [{ path, bytes: 1, sha256: "a".repeat(64) }],
      }),
    ).toThrow();
  }
  expect(() =>
    validateManifest({
      format: "chaco-static-export-v1",
      files: [
        { path: "index.html", bytes: 1, sha256: "a".repeat(64) },
        { path: "index.html", bytes: 1, sha256: "a".repeat(64) },
      ],
    }),
  ).toThrow();
  expect(() =>
    validateManifest({
      format: "chaco-static-export-v1",
      files: [{ path: "index.html", bytes: 1, sha256: "bad" }],
    }),
  ).toThrow();
});
