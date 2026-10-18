import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  readApprovedManifest,
  scanExport,
  verifyExport,
} from "./export-manifest";
import {
  firstPartyLicenses,
  verifyFirstPartyLicenses,
} from "./first-party-licenses";
import { generateHeaders } from "./netlify-headers";
import { noticeName, verifyNotices } from "./third-party-notices";

const root = resolve(import.meta.dir, "..");
const exportRoot = resolve(root, "packages/web/out");

export function assertPublicationBlocked(source: string): void {
  for (const field of ["publicationAllowed", "isPublished"]) {
    const declarations =
      source.match(
        new RegExp(`\\b${field}\\s*:\\s*(?:true|false)\\s*;`, "g"),
      ) ?? [];
    if (declarations.length !== 1 || declarations[0].includes("true")) {
      throw new Error(`Publication contract is not blocked: ${field}`);
    }
  }
}

export function assertSafeTrackedPaths(paths: string[]): void {
  for (const path of paths) {
    if (
      /(?:^|\/)(?:data|archive|private|node_modules|out|\.next)(?:\/|$)/i.test(
        path,
      ) ||
      (/(?:^|\/)\.env(?:\.[^/]*)?$/i.test(path) &&
        !path.endsWith(".example")) ||
      /\.(?:csv|sqlite|db|pem|key|p12|pfx)$/i.test(path)
    ) {
      throw new Error(`Forbidden tracked path: ${path}`);
    }
  }
}

export function assertSafeExportText(path: string, text: string): void {
  const forbidden = [
    /CHACO_(?:FINALIDAD|OBJETO)_CSV|rawCells|Q_NOMENT/i,
    /publicationAllowed\s*[:=]\s*true|isPublished\s*[:=]\s*true/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/,
    /(?:sk_live_|AKIA)[A-Za-z0-9]{16,}/,
    /(?:^|[\s"'])(?:\.env|[A-Za-z]:\\Users\\|\/home\/[^/\s]+\/\.ssh\/)/i,
  ];
  if (forbidden.some((pattern) => pattern.test(text))) {
    throw new Error(`Forbidden content in export: ${path}`);
  }
}

export async function checkCi(
  artifactRoot = exportRoot,
  manifestPath?: string,
): Promise<number> {
  const contract = await readFile(
    resolve(root, "packages/core/src/index.ts"),
    "utf8",
  );
  assertPublicationBlocked(contract);
  const tracked = Bun.spawnSync(["git", "ls-files", "-z"], { cwd: root });
  if (tracked.exitCode !== 0)
    throw new Error("Could not inspect tracked files");
  assertSafeTrackedPaths(
    new TextDecoder().decode(tracked.stdout).split("\0").filter(Boolean),
  );
  const manifest = await scanExport(artifactRoot);
  if (manifestPath) {
    const approved = await readApprovedManifest(artifactRoot, manifestPath);
    await verifyExport(artifactRoot, approved);
  }
  if (!manifest.files.some((file) => file.path === "_headers")) {
    throw new Error("Export is missing generated _headers");
  }
  if (!manifest.files.some((file) => file.path === noticeName)) {
    throw new Error("Export is missing third-party notices");
  }
  await verifyNotices(artifactRoot);
  for (const name of firstPartyLicenses) {
    if (!manifest.files.some((file) => file.path === name))
      throw new Error(`Export is missing first-party license: ${name}`);
  }
  await verifyFirstPartyLicenses(artifactRoot);
  const actualHeaders = await readFile(
    resolve(artifactRoot, "_headers"),
    "utf8",
  );
  if (actualHeaders !== (await generateHeaders(artifactRoot))) {
    throw new Error("Export _headers differs from generated policy");
  }
  if (
    !manifest.files.some(
      (file) =>
        file.path.startsWith("_next/static/") && file.path.endsWith(".js"),
    )
  ) {
    throw new Error("Export is missing Next.js assets");
  }
  for (const file of manifest.files) {
    const text = await readFile(resolve(artifactRoot, file.path), "utf8");
    assertSafeExportText(file.path, text);
  }
  return manifest.files.length;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  if (args.length !== 0 && (args.length !== 2 || args.some((arg) => !arg))) {
    throw new Error(
      "Usage: bun scripts/ci-guard.ts [<export-root> <manifest.json>]",
    );
  }
  checkCi(args[0] ? resolve(args[0]) : exportRoot, args[1])
    .then((count) => {
      console.log(`CI export gate passed: ${count} inventoried files`);
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof Error ? error.message : "CI export gate failed",
      );
      process.exitCode = 1;
    });
}
