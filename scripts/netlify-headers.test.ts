import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateHeaders } from "./netlify-headers";

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "chaco-netlify-test-"));
  roots.push(root);
  for (const section of [
    "404",
    "_not-found",
    "datos",
    "fuentes",
    "metodologia",
    "proyecto",
    "estado",
  ]) {
    await mkdir(join(root, section));
  }
  for (const path of [
    "index.html",
    "404.html",
    "404/index.html",
    "_not-found/index.html",
    "datos/index.html",
    "fuentes/index.html",
    "metodologia/index.html",
    "proyecto/index.html",
    "estado/index.html",
  ]) {
    await writeFile(
      join(root, path),
      '<script>window.test = 1</script><style>body{color:black}</style><p style="display:block">OK</p>',
    );
  }
  return root;
}

test("hashes inline scripts and styles without broad inline allowances", async () => {
  const root = await fixture();
  const headers = await generateHeaders(root);
  for (const text of [
    "window.test = 1",
    "body{color:black}",
    "display:block",
  ]) {
    const digest = createHash("sha256").update(text).digest("base64");
    expect(headers).toContain(`'sha256-${digest}'`);
  }
  expect(headers).not.toContain("'unsafe-inline'");
  expect(headers).toContain("style-src-attr 'unsafe-hashes'");
  expect(headers).toContain("style-src-elem 'self' 'sha256-");
  expect(headers).toContain("Content-Security-Policy-Report-Only:");
  await writeFile(
    join(root, "datos", "index.html"),
    "<script>window.test = 2</script>",
  );
  expect(await generateHeaders(root)).not.toBe(headers);
});

test("denies style attributes when the export has none", async () => {
  const root = await fixture();
  for (const path of [
    "index.html",
    "404.html",
    "404/index.html",
    "_not-found/index.html",
    "datos/index.html",
    "fuentes/index.html",
    "metodologia/index.html",
    "proyecto/index.html",
    "estado/index.html",
  ]) {
    await writeFile(join(root, path), "<script>ok</script>");
  }
  const headers = await generateHeaders(root);
  expect(headers).toContain("style-src-elem 'self'; style-src-attr 'none'");
  expect(headers).not.toContain("'unsafe-hashes'");
});

test("rejects missing and unexpected HTML routes", async () => {
  const root = await fixture();
  await unlink(join(root, "datos", "index.html"));
  expect(generateHeaders(root)).rejects.toThrow("Unexpected HTML route");
  await writeFile(join(root, "datos", "index.html"), "<script>test</script>");
  await writeFile(join(root, "private.html"), "<script>test</script>");
  expect(generateHeaders(root)).rejects.toThrow("Unexpected HTML route");
});

test("hashes decoded quote entities and rejects unsupported entities", async () => {
  const root = await fixture();
  await writeFile(
    join(root, "index.html"),
    '<p style="font-family:&quot;Segoe UI&quot;"></p><script>ok</script>',
  );
  const digest = createHash("sha256")
    .update('font-family:"Segoe UI"')
    .digest("base64");
  expect(await generateHeaders(root)).toContain(`'sha256-${digest}'`);
  await writeFile(
    join(root, "index.html"),
    '<p style="color:&amp;red"></p><script>ok</script>',
  );
  expect(generateHeaders(root)).rejects.toThrow("Unsupported HTML entity");
});

test("rejects unparsed inline elements", async () => {
  const root = await fixture();
  await writeFile(join(root, "index.html"), "<script>unclosed");
  expect(generateHeaders(root)).rejects.toThrow("Unparsed script element");
});
