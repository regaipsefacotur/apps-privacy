#!/usr/bin/env node
// Hazırlanan sürümü Apple incelemesine gönderir.
// Kullanım: node asc-submit-review.mjs <appId>
//
// DİKKAT: Bu işlem geri alınamaz — sürüm inceleme kuyruğuna girer.

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

const appId = process.argv[2];

// 1) Sürümü bul, yayın tipini "onaydan sonra otomatik" yap
const versions = await api("GET", `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10`);
const version = versions.data.find((v) =>
  ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"].includes(
    v.attributes.appStoreState
  )
);
if (!version) throw new Error("Gönderilebilir sürüm yok");

if (version.attributes.releaseType !== "AFTER_APPROVAL") {
  await api("PATCH", `/v1/appStoreVersions/${version.id}`, {
    data: { type: "appStoreVersions", id: version.id, attributes: { releaseType: "AFTER_APPROVAL" } },
  });
  console.log("  yayın tipi: onaydan sonra otomatik");
}

// 2) Açık bir inceleme gönderimi var mı, yoksa oluştur
const existing = await api(
  "GET",
  `/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,UNRESOLVED_ISSUES&limit=5`
);
let submission = existing.data[0];
if (!submission) {
  const created = await api("POST", "/v1/reviewSubmissions", {
    data: {
      type: "reviewSubmissions",
      attributes: { platform: "IOS" },
      relationships: { app: { data: { type: "apps", id: appId } } },
    },
  });
  submission = created.data;
  console.log("  inceleme gönderimi oluşturuldu");
}

// 3) Sürümü gönderime ekle (zaten ekliyse atla)
const items = await api("GET", `/v1/reviewSubmissions/${submission.id}/items`);
const alreadyIncluded = items.data.some((i) => i.relationships?.appStoreVersion?.data?.id === version.id);
if (!alreadyIncluded) {
  await api("POST", "/v1/reviewSubmissionItems", {
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: { data: { type: "reviewSubmissions", id: submission.id } },
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
  console.log(`  sürüm ${version.attributes.versionString} gönderime eklendi`);
}

// 4) Gönder
await api("PATCH", `/v1/reviewSubmissions/${submission.id}`, {
  data: { type: "reviewSubmissions", id: submission.id, attributes: { submitted: true } },
});
console.log("  ✔ Apple incelemesine gönderildi");
