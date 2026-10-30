import test from "node:test";
import assert from "node:assert/strict";
import {
  PROBE_SECRET_NAME,
  constantTimeEqual,
  isAllowedProbeName,
  isAllowedProductionName,
  parseBearer,
} from "../src/policy.mjs";

test("only the fixed reserved probe secret is allowed for the probe", () => {
  assert.equal(isAllowedProbeName(PROBE_SECRET_NAME), true);
  assert.equal(isAllowedProbeName("SUPABASE_DB_PASSWORD"), false);
  assert.equal(isAllowedProbeName("NEOTECHZGZ_BRIDGE_PROBE_OTHER"), false);
});

test("production names must match the exact configured allowlist", () => {
  const allowlist = new Set(["SUPABASE_DB_PASSWORD", "S3_ACCESS_KEY_ID"]);
  assert.equal(isAllowedProductionName("SUPABASE_DB_PASSWORD", allowlist), true);
  assert.equal(isAllowedProductionName("GITHUB_TOKEN", allowlist), false);
  assert.equal(isAllowedProductionName("SUPABASE_DB_PASSWORD", new Set()), false);
});

test("bearer parser rejects malformed and short credentials", () => {
  assert.equal(parseBearer(null), null);
  assert.equal(parseBearer("Basic abc"), null);
  assert.equal(parseBearer("Bearer short"), null);
  assert.equal(parseBearer(`Bearer ${"a".repeat(32)}`), "a".repeat(32));
});

test("constant-time comparison accepts equal values and rejects different values", () => {
  assert.equal(constantTimeEqual("a".repeat(40), "a".repeat(40)), true);
  assert.equal(constantTimeEqual("a".repeat(40), "b".repeat(40)), false);
  assert.equal(constantTimeEqual("short", "shorter"), false);
});
