"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");

try {
  const tag = process.argv[2];
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag || "")) {
    throw new Error("Usage: node scripts/package.cjs v1.0.0");
  }
  const root = path.resolve(__dirname, "..");
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const commit = git(["rev-parse", `${tag}^{commit}`]);
  const pkg = JSON.parse(git(["show", `${tag}:package.json`]));
  const html = git(["show", `${tag}:index.html`]);
  if (pkg.version !== tag.slice(1) || !html.includes(`<meta name="application-version" content="${pkg.version}">`)) {
    throw new Error("The tag, package version and on-screen version must match.");
  }
  const dist = path.join(root, "dist");
  fs.mkdirSync(dist, { recursive: true });
  const filename = `flappybird-showcase-${tag}.zip`;
  const archive = path.join(dist, filename);
  // Archive the named commit, never a possibly dirty working directory.
  git(["archive", "--format=zip", "--prefix=flappybird-showcase/", `--output=${archive}`, tag]);
  const hash = createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
  fs.writeFileSync(path.join(dist, "SHA256SUMS.txt"), `${hash}  ${filename}\n`);
  console.log(`Packaged ${tag} from ${commit}\n${archive}\nSHA-256 ${hash}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
