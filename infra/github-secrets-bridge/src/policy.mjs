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

function derLength(length) {
  if (length < 128) return Uint8Array.of(length);
  const bytes = [];
  for (let value = length; value > 0; value = Math.floor(value / 256)) bytes.unshift(value & 0xff);
  return Uint8Array.from([0x80 | bytes.length, ...bytes]);
}

function der(tag, content) {
  const length = derLength(content.length);
  const result = new Uint8Array(1 + length.length + content.length);
  result[0] = tag;
  result.set(length, 1);
  result.set(content, 1 + length.length);
  return result;
}

function concatBytes(parts) {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

// GitHub App downloads commonly provide PKCS#1 "RSA PRIVATE KEY" PEM.
// WebCrypto expects PKCS#8, so wrap PKCS#1 without exporting or logging key data.
export function pemToPkcs8Bytes(pem) {
  if (typeof pem !== "string") throw new TypeError("GitHub App private key is missing");
  const pkcs1 = /-----BEGIN RSA PRIVATE KEY-----/.test(pem);
  const encoded = pem.replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----|-----END (?:RSA )?PRIVATE KEY-----|\\s/g, "");
  const binary = atob(encoded);
  const raw = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (!pkcs1) return raw;
  const version = Uint8Array.of(0x02, 0x01, 0x00);
  const rsaEncryption = Uint8Array.from([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00]);
  return der(0x30, concatBytes([version, rsaEncryption, der(0x04, raw)]));
}
