import { expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  datasetUrl,
  navigation,
  pendingDecisions,
  resourcePages,
  views,
} from "../src/content";

const webRoot = resolve(import.meta.dir, "..");

test("navigation defines exactly the six editorial routes", () => {
  expect(navigation.map((item) => item.href)).toEqual([
    "/",
    "/datos",
    "/fuentes",
    "/metodologia",
    "/proyecto",
    "/estado",
  ]);
  expect(new Set(navigation.map((item) => item.href)).size).toBe(6);
  expect(views).toHaveLength(2);
  expect(datasetUrl).toBe(
    "https://datosabiertos.chaco.gob.ar/dataset/ejecucionpresupuesto",
  );
  expect(pendingDecisions.length).toBeGreaterThan(0);
  expect(resourcePages).toHaveLength(2);
  for (const resource of resourcePages) {
    expect(resource.href).toBe(`${datasetUrl}/archivo/${resource.id}`);
    expect(resource.href).not.toMatch(/\/download\/|\.csv(?:$|\?)/i);
  }
});

test("each navigation route has a static page and no API routes", async () => {
  for (const route of navigation) {
    const path =
      route.href === "/" ? "app/page.tsx" : `app${route.href}/page.tsx`;
    expect(
      (await readFile(join(webRoot, path), "utf8")).length,
    ).toBeGreaterThan(0);
  }
  const app = await readdir(join(webRoot, "app"), { recursive: true });
  expect(app.some((name) => /(^|[\\/])route\.(ts|tsx)$/.test(name))).toBe(
    false,
  );
});

test("frontend source does not import local archives or ingestion", async () => {
  const files = [
    "src/content.ts",
    "src/components/site-header.tsx",
    "src/components/site-footer.tsx",
    "src/components/page-intro.tsx",
    "app/layout.tsx",
    "app/page.tsx",
    ...navigation.slice(1).map((item) => `app${item.href}/page.tsx`),
  ];
  for (const file of files) {
    const text = await readFile(join(webRoot, file), "utf8");
    expect(text).not.toMatch(
      /@chaco\/(?:ingestion|core)|(?:\.\.\/)+data\/|node:fs|CHACO_(?:FINALIDAD|OBJETO)_CSV/,
    );
  }
  const estado = await readFile(join(webRoot, "app/estado/page.tsx"), "utf8");
  expect(estado).toContain("publicationAllowed=false");
});
