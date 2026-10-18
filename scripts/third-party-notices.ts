import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const sourceRoot = resolve(import.meta.dir, "notices");
const outRoot = resolve(root, "packages/web/out");
export const noticeName = "third-party-notices.txt";
const canary = "19.3.0-canary-278794d7-20261002";
const polyfillHash =
  "0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683";
const licenses = [
  {
    name: "Next.js 16.4.2",
    source: "next-16.4.2.LICENSE",
    hash: "ee765244e2d59f5234d474f62e0766fa0c8b99af967fdd4c0cb8dcb0c76ea224",
    installed: "license.md",
  },
  {
    name: `React / React DOM (Next.js compiled ${canary}; direct packages 19.3.1)`,
    source: "react-family.LICENSE",
    hash: "da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93",
    installed: "dist/compiled/react-dom/LICENSE",
  },
  {
    name: "core-js 3.38.1 (Next.js nomodule polyfill)",
    source: "core-js-3.38.1.LICENSE",
    hash: "51aff0fa92ac49e01ce6ba0fed992b0a34f8afe15203dd5f38c43f9e88b0167b",
  },
  {
    name: "Tailwind CSS 4.3.3 (compiled stylesheet)",
    source: "tailwindcss-4.3.3.LICENSE",
    hash: "60e0b68c0f35c078eef3a5d29419d0b03ff84ec1df9c3f9d6e39a519a5ae7985",
  },
  {
    name: "process/browser (compiled with Next.js)",
    source: "process-browser.LICENSE",
    hash: "59a400d04c5078579acc27ddd6452c1bdf763f9506e01364700935fbb1a7c91b",
    installed: "dist/compiled/process/LICENSE",
  },
] as const;

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function installedNext(): Promise<string> {
  const next = resolve(root, "packages/web/node_modules/next");
  const manifest = (await Bun.file(join(next, "package.json")).json()) as {
    version: string;
  };
  if (manifest.version !== "16.4.2") throw new Error("Next version changed");
  return next;
}

async function assertInstalledSources(): Promise<void> {
  const next = await installedNext();
  for (const license of licenses) {
    if (!("installed" in license)) continue;
    const bytes = await readFile(join(next, license.installed));
    if (sha256(bytes) !== license.hash)
      throw new Error(`Installed license changed: ${license.name}`);
  }
  if (
    sha256(
      await readFile(join(next, "dist/build/polyfills/polyfill-nomodule.js")),
    ) !== polyfillHash
  ) {
    throw new Error("Installed Next polyfill changed");
  }
  const tailwind = resolve(root, "packages/web/node_modules/tailwindcss");
  const tailwindManifest = (await Bun.file(
    join(tailwind, "package.json"),
  ).json()) as {
    version: string;
  };
  if (tailwindManifest.version !== "4.3.3")
    throw new Error("Installed Tailwind CSS version changed");
  if (sha256(await readFile(join(tailwind, "LICENSE"))) !== licenses[3].hash)
    throw new Error("Installed Tailwind CSS license changed");
  for (const name of ["react", "react-dom"]) {
    const manifest = (await Bun.file(
      resolve(root, "packages/web/node_modules", name, "package.json"),
    ).json()) as { version: string };
    if (manifest.version !== "19.3.1")
      throw new Error(`Installed ${name} version changed`);
    if (
      sha256(
        await readFile(
          resolve(root, "packages/web/node_modules", name, "LICENSE"),
        ),
      ) !== licenses[1].hash
    ) {
      throw new Error(`Installed ${name} license changed`);
    }
  }
}

export async function assertBundledEvidence(exportRoot: string): Promise<void> {
  const chunks = resolve(exportRoot, "_next/static/chunks");
  const files = await readdir(chunks);
  const js = files.filter((name) => name.endsWith(".js"));
  const css = files.filter((name) => name.endsWith(".css"));
  if (!js.length || !css.length)
    throw new Error(
      "Unexpected JS/CSS asset inventory; review third-party notices",
    );
  let polyfills = 0;
  let canaryHits = 0;
  let rendererHits = 0;
  let processHits = 0;
  const cssTexts = await Promise.all(
    css.map((name) => readFile(join(chunks, name), "utf8")),
  );
  if (
    cssTexts.filter(
      (text) =>
        text.includes("@layer theme") &&
        text.includes("@layer utilities") &&
        text.includes("--tw-"),
    ).length !== 1
  )
    throw new Error("Compiled Tailwind CSS evidence changed");
  for (const name of js) {
    const bytes = await readFile(join(chunks, name));
    const text = bytes.toString("utf8");
    if (sha256(bytes) === polyfillHash) polyfills++;
    if (text.includes(canary)) canaryHits++;
    if (text.includes('rendererPackageName:"react-dom"')) rendererHits++;
    if (
      text.includes("process.binding is not supported") &&
      text.includes("process.chdir is not supported")
    )
      processHits++;
    for (const match of text.matchAll(
      /\b(?:core-js\s+(?:version\s*)?|react-dom\s+)(\d+\.\d+\.\d+(?:-canary-[\w-]+)?)/gi,
    )) {
      const version = match[1];
      if (version !== "3.38.1" && version !== "19.3.1" && version !== canary)
        throw new Error(`Unreviewed bundled component version: ${version}`);
    }
  }
  if (polyfills !== 1 || canaryHits < 1 || rendererHits < 1 || processHits < 1)
    throw new Error("Bundled polyfill, React DOM or process evidence changed");
}

export async function renderNotices(): Promise<string> {
  const parts = [
    "Third-party software notices / Avisos de software de terceros",
    "These notices apply to identified third-party code in the static export, not to original project content or official data.",
  ];
  for (const license of licenses) {
    const bytes = await readFile(resolve(sourceRoot, license.source));
    if (sha256(bytes) !== license.hash)
      throw new Error(`Reviewed license source changed: ${license.source}`);
    parts.push(
      `\n=== ${license.name} ===\n${bytes.toString("utf8").trimEnd()}`,
    );
  }
  return `${parts.join("\n")}\n`;
}

export async function verifyNotices(exportRoot: string): Promise<void> {
  await assertBundledEvidence(exportRoot);
  const actual = await readFile(resolve(exportRoot, noticeName), "utf8");
  if (actual !== (await renderNotices()))
    throw new Error("Third-party notices differ from reviewed sources");
  for (const path of [
    "index.html",
    "404.html",
    "404/index.html",
    "_not-found/index.html",
    ...["datos", "fuentes", "metodologia", "proyecto", "estado"].map(
      (page) => `${page}/index.html`,
    ),
  ]) {
    const html = await readFile(resolve(exportRoot, path), "utf8");
    if (!html.includes('href="/third-party-notices.txt"'))
      throw new Error(`Missing third-party notices link: ${path}`);
  }
}

if (import.meta.main) {
  const [command, ...extra] = Bun.argv.slice(2);
  if (command !== "generate" || extra.length)
    throw new Error("Usage: bun scripts/third-party-notices.ts generate");
  await assertInstalledSources();
  await assertBundledEvidence(outRoot);
  await writeFile(resolve(outRoot, noticeName), await renderNotices(), {
    flag: "wx",
  });
  await verifyNotices(outRoot);
  console.log(`Generated ${noticeName} from reviewed licenses`);
}
