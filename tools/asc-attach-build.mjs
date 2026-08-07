#!/usr/bin/env node
// En son VALID build'i hazırlanan App Store sürümüne bağlar ve ihracat
// uyumluluğunu (şifreleme muafiyeti) işaretler.
// Kullanım: node asc-attach-build.mjs <appId>

import crypto from "node:crypto";
import fs from "node:fs";

const { ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH } = process.env;
const b64url = (b) =>
  Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const now = Math.floor(Date.now() / 1000);
const signingInput =
  b64url(JSON.stringify({ alg: "ES256", kid: ASC_KEY_ID, typ: "JWT" })) +
  "." +
  b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 900, aud: "appstoreconnect-v1" }));
const TOKEN =
  signingInput +
  "." +
  b64url(
    crypto.sign("sha256", Buffer.from(signingInput), {
      key: fs.readFileSync(ASC_KEY_PATH, "utf8"),
      dsaEncoding: "ieee-p1363",
    })
  );

const API = "https://api.appstoreconnect.apple.com";
async function api(method, endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} -> ${res.status}\n${text}`);
  return text ? JSON.parse(text) : null;
}

const appId = process.argv[2];
if (!appId) {
  console.error("Kullanım: node asc-attach-build.mjs <appId>");
  process.exit(1);
}

// 1) En son VALID build
const builds = await api("GET", `/v1/builds?filter[app]=${appId}&limit=5&sort=-uploadedDate`);
const build = builds.data.find((b) => b.attributes.processingState === "VALID");
if (!build) throw new Error("VALID build yok");
console.log(`  build ${build.attributes.version} (${build.id})`);

// 2) İhracat uyumluluğu — her iki uygulama da yalnızca standart HTTPS kullanıyor, muaf
if (build.attributes.usesNonExemptEncryption === null) {
  await api("PATCH", `/v1/builds/${build.id}`, {
    data: { type: "builds", id: build.id, attributes: { usesNonExemptEncryption: false } },
  });
  console.log("  ihracat uyumluluğu: muaf olarak işaretlendi");
} else {
  console.log(`  ihracat uyumluluğu zaten ayarlı (${build.attributes.usesNonExemptEncryption})`);
}

// 3) Hazırlanan sürüme bağla
const versions = await api("GET", `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10`);
const version = versions.data.find((v) =>
  ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"].includes(
    v.attributes.appStoreState
  )
);
if (!version) throw new Error("Düzenlenebilir sürüm yok");

await api("PATCH", `/v1/appStoreVersions/${version.id}`, {
  data: {
    type: "appStoreVersions",
    id: version.id,
    relationships: { build: { data: { type: "builds", id: build.id } } },
  },
});
console.log(`  ✔ build sürüm ${version.attributes.versionString}'e bağlandı`);
