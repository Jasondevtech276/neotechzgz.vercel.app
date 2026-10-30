import test from "node:test";
import assert from "node:assert/strict";
import {
  PROBE_SECRET_NAME,
  constantTimeEqual,
  isAllowedProbeName,
  parseBearer,
} from "../src/policy.mjs";

test("only the fixed reserved probe secret is allowed", () => {
  assert.equal(isAllowedProbeName(PROBE_SECRET_NAME), true);
  assert.equal(isAllowedProbeName("SUPABASE_DB_PASSWORD"), false);
  assert.equal(isAllowedProbeName("NEOTECHZGZ_BRIDGE_PROBE_OTHER"), false);
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
