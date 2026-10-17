import { lstat, realpath } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { archive, readOriginal } from "./archive.ts";
import { parseDocument, RESOURCES } from "./parser.ts";
import { assess } from "./quality.ts";

async function main(): Promise<void> {
  const [finalidadPath, objetoPath, output = "data"] = process.argv.slice(2);
  if (!finalidadPath || !objetoPath || process.argv.length > 5)
    throw new Error(
      "usage: bun run ingest -- <finalidad.csv> <objeto.csv> [output-directory]",
    );
  const first = await realpath(resolve(finalidadPath));
  const second = await realpath(resolve(objetoPath));
  const destination = resolve(output);
  const permittedRoot = resolve("data");
  if (
    destination !== permittedRoot &&
    !destination.startsWith(`${permittedRoot}${sep}`)
  )
    throw new Error("output must remain under the local data directory");
  const outputParent = await realpath(dirname(destination));
  const safeDestination = join(outputParent, basename(destination));
  if (
    safeDestination !== permittedRoot &&
    !safeDestination.startsWith(`${permittedRoot}${sep}`)
  )
    throw new Error("output path escapes the local data directory");
  try {
    const target = await lstat(safeDestination);
    if (target.isSymbolicLink() || !target.isDirectory())
      throw new Error("output must be an ordinary directory");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (
    first === second ||
    first === safeDestination ||
    second === safeDestination ||
    first.startsWith(`${safeDestination}${sep}`) ||
    second.startsWith(`${safeDestination}${sep}`)
  )
    throw new Error("inputs must be separate from each other and output");
  const views = ["finalidad_fuente", "objeto_fuente"] as const;
  const documents = await Promise.all(
    views.map(async (view, index) => {
      const resource = RESOURCES[view];
      const bytes = await readOriginal(
        index === 0 ? first : second,
        resource.expectedBytes,
        resource.expectedHash,
      );
      return { ...parseDocument(bytes, view), bytes };
    }),
  );
  const [finalidad, objeto] = documents;
  if (!finalidad || !objeto) throw new Error("both documents are required");
  const quality = assess(finalidad.rows, objeto.rows);
  if (quality.state === "rejected")
    throw new Error(
      `local validation rejected; ${quality.findings
        .filter((f) => f.severity === "error")
        .map((f) => f.code)
        .join(", ")}`,
    );
  const directory = await archive(safeDestination, documents, quality);
  console.log(
    JSON.stringify({
      directory,
      counts: quality.counts,
      state: quality.state,
      publicationAllowed: false,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "ingestion failed");
  process.exitCode = 1;
});
