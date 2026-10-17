import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const cli = resolve("packages/ingestion/src/cli.ts");

function invoke(
  args: string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: process.cwd(),
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolveResult({ code, stdout, stderr }));
  });
}

test("CLI rejects missing arguments without creating output", async () => {
  const result = await invoke([]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("usage:");
  expect(result.stdout).toBe("");
});

test("CLI rejects destinations outside local data before reading originals", async () => {
  const result = await invoke([cli, cli, resolve("..", "chaco-outside-test")]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(
    "output must remain under the local data directory",
  );
  expect(result.stdout).toBe("");
});
