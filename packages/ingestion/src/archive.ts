import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { type BudgetDocument, type RawBudgetRow, sha256 } from "@chaco/core";
import type { QualityReport } from "./quality.ts";

export async function readOriginal(
  path: string,
  expectedBytes: number,
  expectedHash: string,
): Promise<Uint8Array> {
  const info = await stat(path);
  if (!info.isFile() || info.size !== expectedBytes)
    throw new Error("original file size/type mismatch");
  const bytes = await readFile(path);
  if (sha256(bytes) !== expectedHash)
    throw new Error("original SHA-256 mismatch");
  return bytes;
}

async function immutable(path: string, bytes: Uint8Array): Promise<void> {
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(
      path,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await handle?.close();
  }
  if (sha256(await readFile(path)) !== sha256(bytes))
    throw new Error("archive collision or corruption");
}

async function restoreOriginal(path: string, bytes: Uint8Array): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await immutable(temporary, bytes);
    try {
      await link(temporary, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    if (sha256(await readFile(path)) !== sha256(bytes))
      throw new Error("archive collision or corruption");
  } finally {
    await rm(temporary, { force: true });
  }
}

async function deterministic(path: string, bytes: Uint8Array): Promise<void> {
  try {
    if ((await lstat(path)).isSymbolicLink())
      throw new Error("derived output symlink is not allowed");
    if (sha256(await readFile(path)) === sha256(bytes)) return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await immutable(temporary, bytes);
    if (
      await lstat(path).then(
        (info) => info.isSymbolicLink(),
        (error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return false;
        },
      )
    )
      throw new Error("derived output symlink is not allowed");
    await rename(temporary, path);
    if (sha256(await readFile(path)) !== sha256(bytes))
      throw new Error("derived output verification failed");
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function archive(
  outDir: string,
  documents: {
    document: BudgetDocument;
    rows: RawBudgetRow[];
    bytes: Uint8Array;
  }[],
  quality: QualityReport,
): Promise<string> {
  for (const { document, bytes } of documents) {
    if (
      bytes.length !== document.byteLength ||
      sha256(bytes) !== document.sha256
    )
      throw new Error("input original changed");
  }
  const root = resolve(outDir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await lstat(root)).isSymbolicLink())
    throw new Error("output symlink is not allowed");
  const encoder = new TextEncoder();
  const digest = sha256(
    encoder.encode(
      JSON.stringify({
        documents: documents.map(({ document, rows }) => ({ document, rows })),
        quality,
      }),
    ),
  );
  const versionDir = join(root, digest);
  try {
    const existing = await lstat(versionDir);
    if (!existing.isDirectory() || existing.isSymbolicLink())
      throw new Error("version path must be an ordinary directory");
    for (const { document, rows, bytes } of documents) {
      const rawPath = join(
        versionDir,
        `${document.view}-${document.sha256}.csv`,
      );
      try {
        if (
          (await lstat(rawPath)).isSymbolicLink() ||
          sha256(await readFile(rawPath)) !== document.sha256
        )
          throw new Error("archived original changed");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await restoreOriginal(rawPath, bytes);
      }
      await deterministic(
        join(versionDir, `${document.view}.json`),
        encoder.encode(`${JSON.stringify({ document, rows })}\n`),
      );
    }
    await deterministic(
      join(versionDir, "quality.json"),
      encoder.encode(`${JSON.stringify(quality)}\n`),
    );
    return versionDir;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const staging = join(
    root,
    `.staging-${digest}-${process.pid}-${randomUUID()}`,
  );
  await mkdir(staging, { mode: 0o700 });
  try {
    for (const { document, rows, bytes } of documents) {
      await immutable(
        join(staging, `${document.view}-${document.sha256}.csv`),
        bytes,
      );
      await deterministic(
        join(staging, `${document.view}.json`),
        encoder.encode(`${JSON.stringify({ document, rows })}\n`),
      );
    }
    await deterministic(
      join(staging, "quality.json"),
      encoder.encode(`${JSON.stringify(quality)}\n`),
    );
    try {
      await rename(staging, versionDir);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        code !== "EEXIST" &&
        code !== "ENOTEMPTY" &&
        !(
          process.platform === "win32" &&
          (code === "EPERM" || code === "EACCES")
        )
      )
        throw error;
      const existing = await lstat(versionDir);
      if (!existing.isDirectory() || existing.isSymbolicLink())
        throw new Error("version path must be an ordinary directory");
      for (const { document, rows, bytes } of documents) {
        const rawPath = join(
          versionDir,
          `${document.view}-${document.sha256}.csv`,
        );
        try {
          if (
            (await lstat(rawPath)).isSymbolicLink() ||
            sha256(await readFile(rawPath)) !== document.sha256
          )
            throw new Error("archived original changed");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          await restoreOriginal(rawPath, bytes);
        }
        await deterministic(
          join(versionDir, `${document.view}.json`),
          encoder.encode(`${JSON.stringify({ document, rows })}\n`),
        );
      }
      await deterministic(
        join(versionDir, "quality.json"),
        encoder.encode(`${JSON.stringify(quality)}\n`),
      );
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return versionDir;
}
