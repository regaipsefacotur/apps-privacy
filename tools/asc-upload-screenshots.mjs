#!/usr/bin/env node
// App Store Connect API ile ekran görüntüsü yükler.
// Kullanım: node asc-upload-screenshots.mjs <appId> <locale> <dosya...>
//
// Chrome eklentisinin file_upload aracı bozuk olduğu için yazıldı; ASC'nin
// üç adımlı yükleme akışını (reservation -> parça yükleme -> commit) uygular.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ISSUER_ID = process.env.ASC_ISSUER_ID;
const KEY_ID = process.env.ASC_KEY_ID;
const KEY_PATH = process.env.ASC_KEY_PATH;

if (!ISSUER_ID || !KEY_ID || !KEY_PATH) {
  console.error("ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_PATH ortam değişkenleri gerekli.");
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function makeToken() {
  const privateKey = fs.readFileSync(KEY_PATH, "utf8");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 15 * 60, aud: "appstoreconnect-v1" };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  // ASC ES256 bekliyor: DER değil, ham r||s (P1363) imza formatı
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${b64url(signature)}`;
}

const TOKEN = makeToken();
const API = "https://api.appstoreconnect.apple.com";

async function api(method, endpoint, body) {
  const res = await fetch(endpoint.startsWith("http") ? endpoint : `${API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} -> ${res.status}\n${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const [appId, locale, ...files] = process.argv.slice(2);
  if (!appId || !locale || files.length === 0) {
    console.error("Kullanım: node asc-upload-screenshots.mjs <appId> <locale> <dosya...>");
    process.exit(1);
  }

  // 1) Hazırlanan sürümü bul
  const versions = await api(
    "GET",
    `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10`
  );
  const version = versions.data.find((v) =>
    ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"].includes(
      v.attributes.appStoreState
    )
  );
  if (!version) throw new Error("Düzenlenebilir sürüm bulunamadı");
  console.log(`  sürüm ${version.attributes.versionString} (${version.attributes.appStoreState})`);

  // 2) Yerelleştirmeyi bul
  const locs = await api("GET", `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  const loc = locs.data.find((l) => l.attributes.locale === locale);
  if (!loc) throw new Error(`Yerelleştirme yok: ${locale} (var olanlar: ${locs.data.map((l) => l.attributes.locale).join(", ")})`);
  console.log(`  yerelleştirme ${loc.attributes.locale}`);

  // 3) 6.9" ekran görüntüsü setini bul ya da oluştur
  const DISPLAY_TYPE = process.env.ASC_DISPLAY_TYPE || "APP_IPHONE_67";
  const sets = await api("GET", `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
  let set = sets.data.find((s) => s.attributes.screenshotDisplayType === DISPLAY_TYPE);
  if (!set) {
    const created = await api("POST", "/v1/appScreenshotSets", {
      data: {
        type: "appScreenshotSets",
        attributes: { screenshotDisplayType: DISPLAY_TYPE },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: "appStoreVersionLocalizations", id: loc.id },
          },
        },
      },
    });
    set = created.data;
    console.log(`  set oluşturuldu (${DISPLAY_TYPE})`);
  } else {
    console.log(`  mevcut set kullanılıyor (${DISPLAY_TYPE})`);
    const existing = await api("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots`);
    for (const shot of existing.data) {
      await api("DELETE", `/v1/appScreenshots/${shot.id}`);
    }
    if (existing.data.length) console.log(`  ${existing.data.length} eski görsel silindi`);
  }

  // 4) Her dosyayı rezerve et, parçaları yükle, commit et
  for (const file of files) {
    const buf = fs.readFileSync(file);
    const name = path.basename(file);

    const reservation = await api("POST", "/v1/appScreenshots", {
      data: {
        type: "appScreenshots",
        attributes: { fileSize: buf.length, fileName: name },
        relationships: {
          appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } },
        },
      },
    });

    const shot = reservation.data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = {};
      for (const h of op.requestHeaders) headers[h.name] = h.value;
      const chunk = buf.subarray(op.offset, op.offset + op.length);
      const put = await fetch(op.url, { method: op.method, headers, body: chunk });
      if (!put.ok) throw new Error(`Parça yüklenemedi (${name}): ${put.status} ${await put.text()}`);
    }

    const checksum = crypto.createHash("md5").update(buf).digest("hex");
    await api("PATCH", `/v1/appScreenshots/${shot.id}`, {
      data: {
        type: "appScreenshots",
        id: shot.id,
        attributes: { uploaded: true, sourceFileChecksum: checksum },
      },
    });
    console.log(`  ✔ ${name}`);
  }

  console.log(`  ${files.length} ekran görüntüsü yüklendi.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
