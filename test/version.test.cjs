"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { updateVersion } = require("../scripts/version.cjs");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "flappy-version-"));
  fs.writeFileSync(path.join(root, "package.json"), '{"name":"fixture","version":"1.0.0"}\n');
  fs.writeFileSync(path.join(root, "index.html"), '<meta name="application-version" content="1.0.0">\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("a release updates the package and on-screen version together", t => {
  const root = fixture(t);
  updateVersion(root, "1.0.1");
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "package.json"))).version, "1.0.1");
  assert.equal(fs.readFileSync(path.join(root, "index.html"), "utf8"), '<meta name="application-version" content="1.0.1">\n');
});

test("version preview reports the planned bump without writing files", t => {
  const root = fixture(t);
  assert.deepEqual(updateVersion(root, "1.0.1", true), { from: "1.0.0", to: "1.0.1" });
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "package.json"))).version, "1.0.0");
  assert.equal(fs.readFileSync(path.join(root, "index.html"), "utf8"), '<meta name="application-version" content="1.0.0">\n');
});

test("duplicate and older versions cannot replace a release", t => {
  const root = fixture(t);
  assert.throws(() => updateVersion(root, "1.0.0"), /newer/);
  assert.throws(() => updateVersion(root, "0.9.9"), /newer/);
});

test("a version cannot become a path or command argument", t => {
  const root = fixture(t);
  for (const value of ["../1.0.1", "v1.0.1", "1.0.1;echo hi", "01.0.1"]) {
    assert.throws(() => updateVersion(root, value), /version/);
  }
});

test("mismatched version surfaces stop a release before either changes", t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "index.html"), '<meta name="application-version" content="0.9.0">\n');
  assert.throws(() => updateVersion(root, "1.0.1"), /match/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "package.json"))).version, "1.0.0");
});
