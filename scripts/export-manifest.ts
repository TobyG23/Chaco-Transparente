import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

export type ManifestEntry = { path: string; bytes: number; sha256: string };
export type ExportManifest = {
  format: "chaco-static-export-v1";
  files: ManifestEntry[];
};

const outRoot = resolve(import.meta.dir, "../packages/web/out");
const pages = new Set([
  "datos",
  "fuentes",
  "metodologia",
  "proyecto",
  "estado",
]);
const htmlPaths = new Set([
  "index.html",
  "404.html",
  "404/index.html",
  "_not-found/index.html",
  ...[...pages].map((page) => `${page}/index.html`),
]);
const safeSegment = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
const hashPattern = /^[a-f0-9]{64}$/;

function allowedPath(path: string): boolean {
  if (htmlPaths.has(path)) return true;
  const parts = path.split("/");
  if (
    parts.some(
      (part) =>
        !safeSegment.test(part) || part.startsWith(".") || part.includes(".."),
    )
  )
    return false;
  if (parts[0] === "_next") {
    return (
      parts.length >= 4 &&
      parts[1] === "static" &&
      parts.slice(2, -1).every((part) => safeSegment.test(part)) &&
      /\.(?:js|css)$/.test(parts.at(-1) ?? "")
    );
  }
  if (!path.endsWith(".txt")) return false;
  if (parts.length === 1)
    return (
      parts[0] === "index.txt" ||
      /^__next\.[A-Za-z0-9_.-]+\.txt$/.test(parts[0])
    );
  const section = parts[0];
  if (!pages.has(section) && section !== "_not-found") return false;
  if (parts.length === 2)
    return (
      parts[1] === "index.txt" ||
      /^__next\.[A-Za-z0-9_.-]+\.txt$/.test(parts[1])
    );
  return (
    parts.length === 3 &&
    /^__next\.[A-Za-z0-9_-]+$/.test(parts[1]) &&
    parts[2] === "__PAGE__.txt"
  );
}

function allowedDirectory(path: string): boolean {
  if (pages.has(path) || path === "404" || path === "_not-found") return true;
  if (path === "_next" || path === "_next/static") return true;
  if (/^_next\/[A-Za-z0-9_-]+$/.test(path)) return true;
  if (/^_next\/static\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(path)) return true;
  if (
    /^(?:datos|fuentes|metodologia|proyecto|estado|_not-found)\/__next\.[A-Za-z0-9_-]+$/.test(
      path,
    )
  )
    return true;
  return false;
}

function inside(root: string, target: string): boolean {
  const remainder = relative(root, target);
  return (
    remainder === "" ||
    (remainder !== ".." &&
      !remainder.startsWith(`..${sep}`) &&
      !isAbsolute(remainder))
  );
}

export async function scanExport(root: string): Promise<ExportManifest> {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
    throw new Error("Export root must be a real directory");
  const canonicalRoot = await realpath(root);
  const files: ManifestEntry[] = [];
  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const stat = await lstat(absolute);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
        throw new Error("Link or special file in export");
      const canonical = await realpath(absolute);
      if (!inside(canonicalRoot, canonical))
        throw new Error("Export path escapes its root");
      const path = relative(root, absolute).split(sep).join("/");
      if (canonical !== join(canonicalRoot, relative(root, absolute)))
        throw new Error("Link or junction in export");
      if (stat.isDirectory()) {
        if (!allowedDirectory(path))
          throw new Error(`Unexpected export directory: ${path}`);
        await walk(absolute);
        continue;
      }
      if (!allowedPath(path))
        throw new Error(`Unexpected export path: ${path}`);
      const handle = await open(
        absolute,
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      );
      try {
        const opened = await handle.stat();
        if (
          !opened.isFile() ||
          opened.size !== stat.size ||
          opened.nlink !== 1 ||
          opened.ino !== stat.ino ||
          opened.dev !== stat.dev ||
          opened.mtimeMs !== stat.mtimeMs ||
          opened.ctimeMs !== stat.ctimeMs
        )
          throw new Error("Export file changed during inspection");
        const bytes = await handle.readFile();
        const after = await lstat(absolute);
        if (
          !after.isFile() ||
          after.isSymbolicLink() ||
          after.size !== opened.size ||
          after.mtimeMs !== opened.mtimeMs ||
          after.ino !== opened.ino ||
          after.dev !== opened.dev ||
          after.ctimeMs !== opened.ctimeMs
        ) {
          throw new Error("Export file changed during hashing");
        }
        files.push({
          path,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      } finally {
        await handle.close();
      }
    }
  };
  await walk(root);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (
    !files.length ||
    [...htmlPaths].some((path) => !files.some((file) => file.path === path))
  ) {
    throw new Error("Export is empty or missing an editorial HTML route");
  }
  const unique = new Set(files.map((file) => file.path.toLowerCase()));
  if (unique.size !== files.length)
    throw new Error("Case-colliding export paths");
  return { format: "chaco-static-export-v1", files };
}

export async function verifyExport(
  root: string,
  value: unknown,
): Promise<number> {
  const expected = validateManifest(value);
  const actual = await scanExport(root);
  if (
    expected.files.length !== actual.files.length ||
    expected.files.some((entry, index) => {
      const found = actual.files[index];
      return (
        entry.path !== found.path ||
        entry.bytes !== found.bytes ||
        entry.sha256 !== found.sha256
      );
    })
  )
    throw new Error("Export differs from approved manifest");
  return actual.files.length;
}

export function validateManifest(value: unknown): ExportManifest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid manifest");
  const candidate = value as Partial<ExportManifest>;
  if (
    candidate.format !== "chaco-static-export-v1" ||
    !Array.isArray(candidate.files) ||
    Object.keys(candidate).sort().join(",") !== "files,format"
  )
    throw new Error("Invalid manifest format");
  if (candidate.files.length > 20_000) throw new Error("Manifest too large");
  let previous = "";
  for (const entry of candidate.files) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      !allowedPath(entry.path) ||
      entry.path <= previous ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 0 ||
      typeof entry.sha256 !== "string" ||
      !hashPattern.test(entry.sha256) ||
      Object.keys(entry).sort().join(",") !== "bytes,path,sha256"
    ) {
      throw new Error("Invalid or unsorted manifest entry");
    }
    previous = entry.path;
  }
  return candidate as ExportManifest;
}

export async function readApprovedManifest(
  root: string,
  manifestPath: string,
): Promise<ExportManifest> {
  const file = resolve(manifestPath);
  const canonicalRoot = await realpath(root);
  if (inside(canonicalRoot, await realpath(file)))
    throw new Error("Manifest must be outside the export");
  const manifestStat = await lstat(file);
  if (
    !manifestStat.isFile() ||
    manifestStat.isSymbolicLink() ||
    manifestStat.size > 1_000_000
  )
    throw new Error("Invalid manifest file");
  const handle = await open(
    file,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  let content: string;
  try {
    const opened = await handle.stat();
    if (
      !opened.isFile() ||
      opened.size !== manifestStat.size ||
      opened.ino !== manifestStat.ino ||
      opened.dev !== manifestStat.dev ||
      opened.size > 1_000_000 ||
      inside(canonicalRoot, await realpath(file))
    )
      throw new Error("Invalid manifest file");
    content = await handle.readFile({ encoding: "utf8" });
  } finally {
    await handle.close();
  }
  return validateManifest(JSON.parse(content));
}

async function main(): Promise<void> {
  const [command, manifestPath, ...extra] = Bun.argv.slice(2);
  if (
    extra.length ||
    !["inventory", "verify"].includes(command ?? "") ||
    (command === "inventory" && manifestPath) ||
    (command === "verify" && !manifestPath)
  ) {
    throw new Error(
      "Usage: bun scripts/export-manifest.ts inventory | verify <manifest.json>",
    );
  }
  if (command === "inventory") {
    const actual = await scanExport(outRoot);
    process.stdout.write(`${JSON.stringify(actual, null, 2)}\n`);
    return;
  }
  const expected = await readApprovedManifest(outRoot, manifestPath as string);
  const count = await verifyExport(outRoot, expected);
  process.stdout.write(`Verified ${count} files; no content was uploaded.\n`);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Export verification failed",
    );
    process.exitCode = 1;
  });
}
