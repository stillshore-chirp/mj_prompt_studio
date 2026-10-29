const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateNodeVersion } = require("./check_node_runtime.cjs");

test("rejects versions below each supported Node security floor", () => {
  for (const version of ["22.23.3", "24.22.0", "26.12.0"]) {
    assert.equal(evaluateNodeVersion(version).supported, false, version);
  }
});

test("accepts the fixed patch and later patches on supported majors", () => {
  for (const version of [
    "22.23.4",
    "22.23.5",
    "24.22.1",
    "24.23.0",
    "26.12.1",
    "26.13.0"
  ]) {
    assert.equal(evaluateNodeVersion(version).supported, true, version);
  }
});

test("rejects unsupported majors and non-release version strings", () => {
  for (const version of ["20.20.0", "23.0.0", "27.0.0", "22.23.4-rc.1", "unknown"]) {
    assert.equal(evaluateNodeVersion(version).supported, false, version);
  }
});
