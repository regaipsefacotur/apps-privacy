# Yayın durumu — 6 Ağustos 2026

## Kimlikler

| | Sakin Nokta | Rota Planlayıcı |
|---|---|---|
| App Store ID | 6798577581 | 6798576007 |
| Bundle ID | com.sefa.sakinnokta | com.sefa.rotaasistani |
| Proje | `SakinNokta/` | `gezi-planlama/` |
| EAS projesi | `@sefacotur/sakin-nokta` | `@sefacotur/rota-asistani` |
| Sürüm | 1.0.0 | 1.0.0 |
| Gizlilik URL | [.../sakin-nokta/](https://regaipsefacotur.github.io/apps-privacy/sakin-nokta/) | [.../rota-asistani/](https://regaipsefacotur.github.io/apps-privacy/rota-asistani/) |

Destek URL (ortak): https://regaipsefacotur.github.io/apps-privacy/destek/

## App Store Connect'te tamamlananlar

Her iki uygulama için:

- Uygulama kaydı, bundle ID, SKU
- Açıklama, anahtar kelimeler, alt başlık, tanıtım metni (TR)
- Destek URL, sürüm 1.0.0, telif
- Kategori (Sakin Nokta: Seyahat + Yaşam Tarzı · Rota Planlayıcı: Seyahat + Navigasyon)
- App Privacy: gizlilik URL'si + "Data Not Collected" — **yayınlandı**
- Yaş sınırı anketi (7 adım) → **4+**, 172 ülke

## Kalanlar

1. **Ekran görüntüleri** — 10 adet 1320×2868 hazır (`store-screenshots/`).
   Media Manager > iPhone 6.9" bölümüne sürükle-bırak gerekiyor.
2. **Build** — Apple kimlik doğrulaması (şifre + 2FA) gerektirdiği için elle:
   ```
   cd SakinNokta      && eas build --platform ios --profile production
   cd gezi-planlama   && eas build --platform ios --profile production
   ```
   Ardından `eas submit --platform ios` veya ASC'de build seçimi.
3. **"Add for Review"** — yukarıdaki ikisi tamamlanınca aktifleşir.

## Açık kalan teknik not

`gezi-planlama/app.json` içinde Android Google Maps anahtarı hâlâ placeholder
(`GOOGLE_MAPS_ANDROID_API_KEY_BURAYA`). iOS yayını etkilemiyor; Play'e çıkılırsa
gerçek anahtar gerekiyor. SakinNokta'da bu tanım hiç yok, o da Android'de
eklenmeli.
