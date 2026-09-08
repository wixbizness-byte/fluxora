import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const baselineBytes = 207_761;
const requiredReductionBytes = 20_000;
const manifestPath = path.resolve(".next/server/app/member/page_client-reference-manifest.js");
const source = await readFile(manifestPath, "utf8");
const marker = 'globalThis.__RSC_MANIFEST["/member/page"] = ';
const start = source.indexOf(marker);
assert.notEqual(start, -1, "member client-reference manifest entry is missing");
const manifest = JSON.parse(source.slice(start + marker.length).trim().replace(/;$/, ""));
const chunks = manifest.entryJSFiles["[project]/app/member/page"];
assert.ok(Array.isArray(chunks) && chunks.length > 0, "member page entry chunks are missing");

let initialBytes = 0;
for (const chunk of chunks) {
  initialBytes += (await stat(path.resolve(".next", chunk))).size;
}

const reduction = baselineBytes - initialBytes;
console.log(JSON.stringify({ baselineBytes, initialBytes, reductionBytes: reduction, chunks }, null, 2));
assert.ok(
  reduction >= requiredReductionBytes,
  `member initial JS must shrink by at least ${requiredReductionBytes} bytes (actual reduction: ${reduction})`,
);
