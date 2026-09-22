import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const cssPath = path.join(root, "app", "globals.css");
const css = fs.readFileSync(cssPath, "utf8");
const errors = [];

const bannedPatterns = [
  [/(linear|radial|conic)-gradient\s*\(/i, "No gradients in ordinary UI"],
  [/backdrop-filter\s*:/i, "No glassmorphism/backdrop blur"],
  [/filter\s*:\s*blur\(/i, "No decorative blur"],
  [/box-shadow\s*:[^;]*(102|139|124|246|232)/i, "No purple glow/shadow"],
];

for (const [pattern, message] of bannedPatterns) {
  if (pattern.test(css)) errors.push(message);
}

for (const token of [
  "#6658e8", "#5749d5", "#f0eeff", "#fafaf8", "#ffffff", "#f5f5f2",
  "#18181b", "#52525b", "#71717a", "#e4e4e7", "#d4d4d8", "#16a34a",
  "#d97706", "#dc2626", "#2563eb",
]) {
  if (!css.toLowerCase().includes(token)) errors.push(`Missing required token ${token}`);
}

const radiusMatches = [...css.matchAll(/border-radius\s*:\s*([^;]+);/gi)].map((match) => match[1].trim());
for (const value of radiusMatches) {
  const allowed = value.includes("var(--fx-radius-") || value === "0" || value === "var(--fx-radius-xl) var(--fx-radius-xl) 0 0";
  if (!allowed) errors.push(`Unapproved border radius: ${value}`);
}

if (errors.length) {
  console.error("Fluxora brand QA failed:\n- " + [...new Set(errors)].join("\n- "));
  process.exit(1);
}

console.log("Fluxora brand QA passed.");
