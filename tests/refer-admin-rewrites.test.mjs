import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const compact = source.replace(/\s+/g, " ");

test("canonical referral admin routes proxy to the existing prompt-gallery admin surfaces", () => {
  assert.match(
    compact,
    /source: "\/refer\/admin", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referrals`/,
  );
  assert.match(
    compact,
    /source: "\/refer\/admin\/tree", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referrals\/tree`/,
  );
  assert.match(
    compact,
    /source: "\/refer\/admin\/risk", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referral-risk`/,
  );
});

test("member-facing /refer is not replaced by a broad proxy", () => {
  assert.doesNotMatch(source, /source:\s*["']\/refer\/:path\*["']/);
});
