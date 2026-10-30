"use strict";

const fs = require("node:fs");
const path = require("node:path");

function versionParts(version) {
  if (typeof version !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error("Use a version such as 1.0.1, without a leading v.");
  }
  const parts = version.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error("The version numbers are too large.");
  return parts;
}

function updateVersion(root, next, preview = false) {
  const nextParts = versionParts(next);
  const packagePath = path.join(root, "package.json");
  const htmlPath = path.join(root, "index.html");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const currentParts = versionParts(pkg.version);
  const html = fs.readFileSync(htmlPath, "utf8");
  const versionTags = Array.from(html.matchAll(/<meta name="application-version" content="([^"]+)">/g));
  if (versionTags.length !== 1 || versionTags[0][1] !== pkg.version) {
    throw new Error("The package and on-screen versions must match before releasing.");
  }
  const firstDifference = nextParts.findIndex((value, i) => value !== currentParts[i]);
  if (firstDifference < 0 || nextParts[firstDifference] < currentParts[firstDifference]) {
    throw new Error("The release version must be newer than " + pkg.version + ".");
  }
  const result = { from: pkg.version, to: next };
  if (!preview) {
    pkg.version = next;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
    fs.writeFileSync(htmlPath, html.replace(versionTags[0][0], `<meta name="application-version" content="${next}">`));
  }
  return result;
}

module.exports = { updateVersion };

if (require.main === module) {
  try {
    const [next, flag, extra] = process.argv.slice(2);
    if (extra || (flag && flag !== "--check")) throw new Error("Usage: node scripts/version.cjs 1.0.1 [--check]");
    const result = updateVersion(path.resolve(__dirname, ".."), next, flag === "--check");
    console.log(`${flag === "--check" ? "Preview" : "Version"}: ${result.from} -> ${result.to}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
