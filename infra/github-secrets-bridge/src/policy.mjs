export const PROBE_SECRET_NAME = "NEOTECHZGZ_BRIDGE_PROBE";
export const REPOSITORY = "Jasondevtech276/neotechzgz.vercel.app";

export function isAllowedProbeName(name) {
  return name === PROBE_SECRET_NAME;
}

export function isAllowedProductionName(name, configuredNames) {
  return typeof name === "string" && configuredNames instanceof Set && configuredNames.has(name);
}

export function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export function parseBearer(header) {
  if (typeof header !== "string") return null;
  const match = /^Bearer ([A-Za-z0-9._~-]{32,512})$/.exec(header);
  return match?.[1] ?? null;
}
