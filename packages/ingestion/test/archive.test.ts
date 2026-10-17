import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archive } from "../src/archive.ts";
import { HEADERS, parseDocument } from "../src/parser.ts";
import { assess } from "../src/quality.ts";

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

test("synthetic archive is idempotent and does not publish", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-synthetic-"));
  temporary.push(root);
  const line =
    "0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00";
  const bytes = new TextEncoder().encode(
    `${HEADERS.finalidad_fuente.join(";")}\r\n${line}\r\n`,
  );
  const parsed = parseDocument(bytes, "finalidad_fuente", false);
  const quality = assess(parsed.rows, []);
  const entry = { ...parsed, bytes };
  const first = await archive(root, [entry], quality);
  const before = await readFile(join(first, "finalidad_fuente.json"));
  expect(await archive(root, [entry], quality)).toBe(first);
  expect(await readFile(join(first, "finalidad_fuente.json"))).toEqual(before);
  expect(await readdir(root)).toHaveLength(1);
  await writeFile(join(first, "finalidad_fuente.json"), before.subarray(0, 12));
  expect(await archive(root, [entry], quality)).toBe(first);
  expect(await readFile(join(first, "finalidad_fuente.json"))).toEqual(before);
  expect(await readdir(first)).toHaveLength(3);
  await rm(
    join(first, `${parsed.document.view}-${parsed.document.sha256}.csv`),
  );
  expect(await archive(root, [entry], quality)).toBe(first);
  expect(
    await readFile(
      join(first, `${parsed.document.view}-${parsed.document.sha256}.csv`),
    ),
  ).toEqual(Buffer.from(bytes));
  expect((await readdir(first)).every((name) => !name.endsWith(".tmp"))).toBe(
    true,
  );
  const changedQuality = { ...quality, state: "review_required" as const };
  expect(await archive(root, [entry], changedQuality)).not.toBe(first);
  expect(await readdir(root)).toHaveLength(2);
  expect(quality.publicationAllowed).toBe(false);
});

test("archive repairs a truncated quality report", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-quality-"));
  temporary.push(root);
  const bytes = new TextEncoder().encode(
    `${HEADERS.finalidad_fuente.join(";")}\r\n0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00\r\n`,
  );
  const parsed = parseDocument(bytes, "finalidad_fuente", false);
  const quality = assess(parsed.rows, []);
  const entry = { ...parsed, bytes };
  const version = await archive(root, [entry], quality);
  const expected = await readFile(join(version, "quality.json"));
  await writeFile(join(version, "quality.json"), expected.subarray(0, 5));
  expect(await archive(root, [entry], quality)).toBe(version);
  expect(await readFile(join(version, "quality.json"))).toEqual(expected);
  expect((await readdir(version)).every((name) => !name.endsWith(".tmp"))).toBe(
    true,
  );
});

test("archive refuses to overwrite a corrupt original", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-corrupt-"));
  temporary.push(root);
  const bytes = new TextEncoder().encode(
    `${HEADERS.finalidad_fuente.join(";")}\r\n0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00\r\n`,
  );
  const parsed = parseDocument(bytes, "finalidad_fuente", false);
  const quality = assess(parsed.rows, []);
  const entry = { ...parsed, bytes };
  const version = await archive(root, [entry], quality);
  const rawPath = join(
    version,
    `${parsed.document.view}-${parsed.document.sha256}.csv`,
  );
  const corrupt = bytes.subarray(0, 12);
  await writeFile(rawPath, corrupt);
  expect(archive(root, [entry], quality)).rejects.toThrow(
    "archived original changed",
  );
  expect(await readFile(rawPath)).toEqual(Buffer.from(corrupt));
  expect((await readdir(version)).every((name) => !name.endsWith(".tmp"))).toBe(
    true,
  );
});

test("concurrent archives keep one complete version", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-concurrent-"));
  temporary.push(root);
  const bytes = new TextEncoder().encode(
    `${HEADERS.finalidad_fuente.join(";")}\r\n0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00\r\n`,
  );
  const parsed = parseDocument(bytes, "finalidad_fuente", false);
  const quality = assess(parsed.rows, []);
  const entry = { ...parsed, bytes };
  const results = await Promise.all(
    Array.from({ length: 4 }, () => archive(root, [entry], quality)),
  );
  expect(new Set(results).size).toBe(1);
  const version = results[0];
  if (!version) throw new Error("missing archive version");
  expect(await readdir(root)).toHaveLength(1);
  expect(
    await readFile(
      join(version, `${parsed.document.view}-${parsed.document.sha256}.csv`),
    ),
  ).toEqual(Buffer.from(bytes));
  expect((await readdir(version)).every((name) => !name.endsWith(".tmp"))).toBe(
    true,
  );
});

test("archive rejects mismatched original bytes before creating output", async () => {
  const root = await mkdtemp(join(tmpdir(), "chaco-mismatch-"));
  temporary.push(root);
  const line =
    "0001;Entidad;1;Finalidad;-;1;-;1;Fuente;10,00;10,00;8,00;7,00;6,00;2,00;80,00";
  const bytes = new TextEncoder().encode(
    `${HEADERS.finalidad_fuente.join(";")}\r\n${line}\r\n`,
  );
  const parsed = parseDocument(bytes, "finalidad_fuente", false);
  const quality = assess(parsed.rows, []);
  const altered = bytes.slice();
  altered[altered.length - 3] = 49;
  expect(
    archive(join(root, "new"), [{ ...parsed, bytes: altered }], quality),
  ).rejects.toThrow("input original changed");
  expect(await readdir(root)).toHaveLength(0);
});
