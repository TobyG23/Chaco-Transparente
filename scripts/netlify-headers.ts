import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dir, "../packages/web/out");
const htmlPaths = [
  "index.html",
  "404.html",
  "404/index.html",
  "_not-found/index.html",
  ...["datos", "fuentes", "metodologia", "proyecto", "estado", "cobertura"].map(
    (section) => `${section}/index.html`,
  ),
];

function hash(text: string): string {
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

function inlineBlocks(html: string, tag: "script" | "style"): string[] {
  const expression = new RegExp(
    `<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`,
    "gi",
  );
  const blocks = [...html.matchAll(expression)];
  if (
    blocks.length !== [...html.matchAll(new RegExp(`<${tag}\\b`, "gi"))].length
  )
    throw new Error(`Unparsed ${tag} element in export`);
  return blocks
    .filter((match) => {
      const attrs = match[1] ?? "";
      if (attrs.includes(">") || /\bon\w+\s*=/i.test(attrs))
        throw new Error(`Unexpected ${tag} attributes in export`);
      if (tag === "style" && /\bsrc\s*=/i.test(attrs))
        throw new Error("Unexpected style source in export");
      return !/\bsrc\s*=/i.test(attrs);
    })
    .map((match) => match[2] ?? "");
}

function styleAttributes(html: string): string[] {
  const matches = [...html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)];
  if (matches.length !== [...html.matchAll(/\sstyle\s*=/gi)].length)
    throw new Error("Unparsed style attribute in export");
  return matches.map((match) => {
    const value = match[1] ?? match[2] ?? "";
    // Next's error page encodes quotes in font-family; hash the decoded DOM value.
    const decoded = value.replaceAll("&quot;", '"');
    if (decoded.includes("&"))
      throw new Error("Unsupported HTML entity in style attribute");
    return decoded;
  });
}

const common = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
];

export async function generateHeaders(exportRoot: string): Promise<string> {
  const stat = await lstat(exportRoot);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error("Invalid export root");
  const actual: string[] = [];
  const walk = async (directory: string): Promise<void> => {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink() || (!item.isDirectory() && !item.isFile()))
        throw new Error("Link or special file in export");
      const path = join(directory, item.name);
      if (item.isDirectory()) await walk(path);
      else if (path.endsWith(".html"))
        actual.push(relative(exportRoot, path).split(sep).join("/"));
    }
  };
  await walk(exportRoot);
  if (
    actual.length !== htmlPaths.length ||
    actual.some((path) => !htmlPaths.includes(path))
  ) {
    throw new Error("Unexpected HTML route in export");
  }
  const scripts = new Set<string>();
  const styles = new Set<string>();
  const attrs = new Set<string>();
  for (const path of htmlPaths) {
    const html = await readFile(join(exportRoot, path), "utf8");
    for (const block of inlineBlocks(html, "script")) scripts.add(hash(block));
    for (const block of inlineBlocks(html, "style")) styles.add(hash(block));
    for (const attr of styleAttributes(html)) attrs.add(hash(attr));
  }
  if (!scripts.size)
    throw new Error("No inline scripts found; inspect changed export");
  const directives = [
    ...common,
    `script-src 'self' ${[...scripts].sort().join(" ")}`,
    `style-src-elem 'self'${styles.size ? ` ${[...styles].sort().join(" ")}` : ""}`,
    attrs.size
      ? `style-src-attr 'unsafe-hashes' ${[...attrs].sort().join(" ")}`
      : "style-src-attr 'none'",
  ];
  // One site-wide policy avoids different hashes for navigation and the error fallback.
  const csp = directives.join("; ");
  const headers = [
    "/*",
    `  Content-Security-Policy-Report-Only: ${csp}`,
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: no-referrer",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "  X-Frame-Options: DENY",
    "",
  ].join("\n");
  if (headers.includes("'unsafe-inline'"))
    throw new Error("Unexpected unsafe-inline directive");
  return headers;
}

async function main(): Promise<void> {
  const [command, ...rest] = Bun.argv.slice(2);
  if (command !== "generate" || rest.length)
    throw new Error("Usage: bun scripts/netlify-headers.ts generate");
  const output = join(root, "_headers");
  const candidate = await generateHeaders(root);
  await writeFile(output, candidate, { flag: "wx" });
  process.stdout.write(
    `Generated _headers (${Buffer.byteLength(candidate)} bytes); inspect it before approval.\n`,
  );
}

if (
  import.meta.main &&
  pathToFileURL(Bun.argv[1] ?? "").href === import.meta.url
) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Header generation failed",
    );
    process.exitCode = 1;
  });
}
