const MINIMUMS = Object.freeze({
  22: Object.freeze([23, 4]),
  24: Object.freeze([22, 1]),
  26: Object.freeze([12, 1])
});

function evaluateNodeVersion(version) {
  if (typeof version !== "string") {
    return { supported: false, reason: "invalid" };
  }

  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) {
    return { supported: false, reason: "invalid" };
  }

  const [, majorText, minorText, patchText] = match;
  const major = Number(majorText);
  const minor = Number(minorText);
  const patch = Number(patchText);
  const minimum = MINIMUMS[major];
  if (!minimum) {
    return { supported: false, reason: "unsupported-major" };
  }

  const [minimumMinor, minimumPatch] = minimum;
  const supported =
    minor > minimumMinor || (minor === minimumMinor && patch >= minimumPatch);

  return {
    supported,
    reason: supported ? "supported" : "below-security-floor",
    minimum: `${major}.${minimumMinor}.${minimumPatch}`
  };
}

if (require.main === module) {
  const version = process.versions.node;
  const result = evaluateNodeVersion(version);
  if (!result.supported) {
    const supportedLines = Object.entries(MINIMUMS)
      .map(([major, [minor, patch]]) => `${major}.${minor}.${patch}+`)
      .join(", ");
    console.error(
      `Node.js runtime rejected: detected ${version} (${result.reason}). Use a supported fixed line: ${supportedLines}.`
    );
    process.exitCode = 1;
  } else {
    console.log(`Node.js ${version} satisfies the supported runtime floor.`);
  }
}

module.exports = { evaluateNodeVersion };
