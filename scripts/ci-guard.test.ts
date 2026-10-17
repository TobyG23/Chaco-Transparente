import { expect, test } from "bun:test";
import {
  assertPublicationBlocked,
  assertSafeExportText,
  assertSafeTrackedPaths,
} from "./ci-guard";

test("publication contracts must each remain exactly false", () => {
  const contract = "publicationAllowed: false;\nisPublished: false;";
  expect(() => assertPublicationBlocked(contract)).not.toThrow();
  for (const changed of [
    "publicationAllowed: true;\nisPublished: false;",
    "publicationAllowed: false;\nisPublished: true;",
    "publicationAllowed: false;\npublicationAllowed: true;\nisPublished: false;",
    "publicationAllowed: false;",
  ]) {
    expect(() => assertPublicationBlocked(changed)).toThrow();
  }
});

test("tracked paths exclude private files and original or derived data", () => {
  expect(() =>
    assertSafeTrackedPaths([".env.example", "packages/web/app/page.tsx"]),
  ).not.toThrow();
  for (const path of [
    "data/original.csv",
    "packages/web/out/index.html",
    "private/notes.txt",
    ".env.production",
    "secret.pem",
    "exports/report.csv",
  ]) {
    expect(() => assertSafeTrackedPaths([path])).toThrow();
  }
});

test("export text rejects known data and credential markers", () => {
  expect(() =>
    assertSafeExportText(
      "index.html",
      "Proyecto independiente; sin importes publicados.",
    ),
  ).not.toThrow();
  for (const text of [
    "rawCells",
    "isPublished: true",
    "CHACO_FINALIDAD_CSV",
    "-----BEGIN PRIVATE KEY-----",
  ]) {
    expect(() => assertSafeExportText("index.html", text)).toThrow();
  }
});
