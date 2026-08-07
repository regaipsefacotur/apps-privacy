#!/usr/bin/env node
// Hazırlanan sürümün "App Review Information" bölümünü doldurur.
// Kullanım: node asc-review-details.mjs <appId> <notlarDosyasi>

import crypto from "node:crypto";
import fs from "node:fs";

const { ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH } = process.env;
const b64url = (b) =>
  Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const now = Math.floor(Date.now() / 1000);
const si =
  b64url(JSON.stringify({ alg: "ES256", kid: ASC_KEY_ID, typ: "JWT" })) +
  "." +
  b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 900, aud: "appstoreconnect-v1" }));
const TOKEN =
  si +
  "." +
  b64url(
    crypto.sign("sha256", Buffer.from(si), {
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

const [appId, notesFile] = process.argv.slice(2);
const notes = fs.readFileSync(notesFile, "utf8").trim();

const attributes = {
  contactFirstName: "Regaip Sefa",
  contactLastName: "Çotur",
  contactPhone: "+905322101161",
  contactEmail: "regaipsefa.cotur@gmail.com",
  demoAccountRequired: false,
  notes,
};

const versions = await api("GET", `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10`);
const version = versions.data.find((v) =>
  ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"].includes(
    v.attributes.appStoreState
  )
);
if (!version) throw new Error("Düzenlenebilir sürüm yok");

const existing = await fetch(`${API}/v1/appStoreVersions/${version.id}/appStoreReviewDetail`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const existingJson = existing.ok ? await existing.json() : null;

if (existingJson?.data?.id) {
  await api("PATCH", `/v1/appStoreReviewDetails/${existingJson.data.id}`, {
    data: { type: "appStoreReviewDetails", id: existingJson.data.id, attributes },
  });
  console.log("  ✔ inceleme bilgisi güncellendi");
} else {
  await api("POST", "/v1/appStoreReviewDetails", {
    data: {
      type: "appStoreReviewDetails",
      attributes,
      relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } },
    },
  });
  console.log("  ✔ inceleme bilgisi oluşturuldu");
}
