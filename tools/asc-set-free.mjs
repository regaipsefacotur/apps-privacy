#!/usr/bin/env node
// Uygulamayı tüm bölgelerde ücretsiz olarak fiyatlandırır.
// Kullanım: node asc-set-free.mjs <appId>

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

// Türkiye'yi temel bölge alıp ücretsiz (0,00) fiyat noktasını bul
const BASE_TERRITORY = "TUR";
const points = await api(
  "GET",
  `/v1/apps/${appId}/appPricePoints?filter[territory]=${BASE_TERRITORY}&limit=200`
);
const free = points.data.find((p) => parseFloat(p.attributes.customerPrice) === 0);
if (!free) throw new Error("Ücretsiz fiyat noktası bulunamadı");
console.log(`  ücretsiz fiyat noktası: ${free.id}`);

await api("POST", "/v1/appPriceSchedules", {
  data: {
    type: "appPriceSchedules",
    relationships: {
      app: { data: { type: "apps", id: appId } },
      baseTerritory: { data: { type: "territories", id: BASE_TERRITORY } },
      manualPrices: { data: [{ type: "appPrices", id: "${price-free}" }] },
    },
  },
  included: [
    {
      type: "appPrices",
      id: "${price-free}",
      attributes: { startDate: null, endDate: null },
      relationships: { appPricePoint: { data: { type: "appPricePoints", id: free.id } } },
    },
  ],
});
console.log("  ✔ tüm bölgelerde ücretsiz olarak ayarlandı");
