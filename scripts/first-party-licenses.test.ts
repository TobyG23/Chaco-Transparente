import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  firstPartyLicenses,
  verifyFirstPartyLicenses,
} from "./first-party-licenses";

test("first-party license verification compares exact source bytes and all links", async () => {
  const root = resolve(import.meta.dir, "..");
  const temporary = await mkdtemp(join(tmpdir(), "chaco-first-party-"));
  const links =
    '<a href="/LICENSE">Code</a><a href="/LICENSE-CONTENT.txt">Content</a>';
  try {
    for (const name of firstPartyLicenses)
      await writeFile(join(temporary, name), await readFile(join(root, name)));
    for (const page of [
      "404",
      "_not-found",
      "datos",
      "fuentes",
      "metodologia",
      "proyecto",
      "estado",
    ]) {
      await mkdir(join(temporary, page));
      await writeFile(join(temporary, page, "index.html"), links);
    }
    for (const page of ["index.html", "404.html"])
      await writeFile(join(temporary, page), links);
    await expect(verifyFirstPartyLicenses(temporary)).resolves.toBeUndefined();
    await writeFile(join(temporary, "LICENSE"), "altered");
    expect(verifyFirstPartyLicenses(temporary)).rejects.toThrow(
      "license differs",
    );
    await writeFile(
      join(temporary, "LICENSE"),
      await readFile(join(root, "LICENSE")),
    );
    await writeFile(
      join(temporary, "_not-found", "index.html"),
      '<a href="/LICENSE">Code</a>',
    );
    expect(verifyFirstPartyLicenses(temporary)).rejects.toThrow(
      "Missing first-party license link",
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
