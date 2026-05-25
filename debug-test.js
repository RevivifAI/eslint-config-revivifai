import { keepAChangelogPlugin } from "./dist/keep-a-changelog-plugin.js";
import { readFileSync } from "fs";

const text = readFileSync("CHANGELOG.md", "utf8");
const lines = text.split("\n");
const validCategories = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];

console.log("Testing regex patterns on CHANGELOG.md\n");

// Track categories seen per version section
const versionCategories = new Map();
let currentVersion = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for version heading
  const versionMatch = /^##\s+(?:\[)?([^\]\s]+)(?:\])?/.exec(line);
  if (versionMatch) {
    currentVersion = versionMatch[1];
    console.log(`Line ${i + 1}: Found version "${currentVersion}"`);
    if (!versionCategories.has(currentVersion)) {
      versionCategories.set(currentVersion, new Set());
    }
  }
  
  // Check for category heading
  const categoryMatch = new RegExp(`^###\\s+(${validCategories.join("|")})\\s*\r?$`).exec(line);
  if (categoryMatch) {
    const category = categoryMatch[1];
    console.log(`Line ${i + 1}: Found category "${category}" under version "${currentVersion}"`);
    const seenInVersion = versionCategories.get(currentVersion);
    if (seenInVersion?.has(category)) {
      console.log(`  -> DUPLICATE DETECTED!`);
    } else {
      seenInVersion?.add(category);
    }
  }
}

console.log("\nFinal state:");
console.log("versionCategories:", versionCategories);