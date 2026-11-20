// apps-privacy/uygulamalar/<slug>/ tanıtım sayfalarını, katalog, sitemap, robots ve llms.txt'yi üretir.
import fs from "node:fs";
import path from "node:path";
const D = JSON.parse(fs.readFileSync(new URL("./aso/desc.json", import.meta.url)));
const M = JSON.parse(fs.readFileSync(new URL("./aso/meta-final.json", import.meta.url)));
const OUT = "/Users/sefa/Development/apps-privacy";
const BASE = "https://regaipsefacotur.github.io/apps-privacy";
const TODAY = "2026-11-20";

const PRIVACY = {
  nurum: `${BASE}/nurum/`, risale: `${BASE}/risale/`, linguaflow: `${BASE}/linguaflow/`, "ayet-ayet": `${BASE}/ayet-ayet/`,
  mihver: `${BASE}/mihver/`, sukur: "https://sefacotur.com/privacy", cark: `${BASE}/cark/`, walkup: `${BASE}/walkup/`,
  "sakin-nokta": `${BASE}/sakin-nokta/`, "rota-planlayici": `${BASE}/rota-asistani/`,
  hereafter: "https://gist.github.com/regaipsefacotur/1783563fbb058ff07a83eface32f1062",
  tally: "https://gist.github.com/regaipsefacotur/9a644f4c30ca93d1ff4805f4701c5d9f",
  "dodge-arena": "https://dodgearena.surge.sh/privacy.html", "hocaya-sor": "https://hocayasor-destek.surge.sh", detoks: `${BASE}/detoks/`,
};
const CAT = { nurum: "ReferenceApplication", risale: "BookApplication", linguaflow: "EducationalApplication", "ayet-ayet": "ReferenceApplication",
  mihver: "HealthApplication", sukur: "LifestyleApplication", cark: "UtilitiesApplication", walkup: "UtilitiesApplication",
  "sakin-nokta": "TravelApplication", "rota-planlayici": "TravelApplication", hereafter: "LifestyleApplication", tally: "FinanceApplication",
  "dodge-arena": "GameApplication", "hocaya-sor": "LifestyleApplication", detoks: "ProductivityApplication" };

// Açıklamalardan çıkan, doğrulanabilir bilgilere dayalı SSS (her uygulama ücretsiz, uygulama içi satın alma yok — ASC'den kontrol edildi)
const FREE_TR = ["Ücretli mi?", "Hayır. Uygulama ücretsizdir; uygulama içi satın alma veya abonelik yoktur."];
const FREE_EN = ["Is it free?", "Yes. The app is free, with no in-app purchases or subscriptions."];
const FAQ = {
  nurum: [FREE_TR, ["Namaz vakitleri internetsiz çalışır mı?", "Evet. Diyanet vakitleri 81 il ve yaklaşık 900 ilçe için uygulamanın içinde gelir; internet olmadan da gösterilir."], ["Zikirmatik widget'ı var mı?", "Evet. Ana ekran ve kilit ekranı widget'ından uygulamayı açmadan zikir çekebilirsin."], ["Hesap açmak gerekiyor mu?", "Hayır. Hesap, reklam ve takip yoktur; kayıtların yalnızca cihazında tutulur."]],
  risale: [FREE_TR, ["Hangi kitaplar var?", "Sözler, Mektubat, Lem'alar, Şuâlar, Mesnevî-i Nuriye, İşârâtü'l-İ'câz, Asâ-yı Mûsâ, Lâhikalar ve diğer eserlerle birlikte Külliyatın tamamı."], ["Bilmediğim kelimenin anlamını nasıl görürüm?", "Kelimeye dokunman yeterli; o cümledeki anlamı, kökü ve Osmanlıca yazılışı açılır."], ["Sesli dinleme internetsiz çalışır mı?", "Bir kitabın sesini indirip internetsiz dinleyebilirsin; ekran kilitliyken de çalmaya devam eder."]],
  linguaflow: [FREE_TR, ["Hangi seviyeler için uygun?", "A1, A2, B1 ve B2 seviyelerinde toplam 104 sesli hikâye bölümü vardır."], ["Telaffuzumu nasıl çalışırım?", "Gölgeleme alıştırmasında cümleyi dinleyip aynı ritimle tekrar edersin; telaffuzun anında puanlanır."], ["Kelime listesi var mı?", "A1'den C2'ye yaklaşık 9.700 kelime, Türkçe karşılıkları ve örnek cümleleriyle; düzensiz fiiller ayrı listededir."]],
  "ayet-ayet": [FREE_TR, ["Kur'an'ı baştan sona nasıl bitiririm?", "Her gün sana ayrılan okumayı meal ve tefsiriyle okursun; sırayla ilerlediğin için hiçbir ayet atlanmaz."], ["Okumayı unutursam ne olur?", "Seçtiğin saatte bildirim gelir; o günün okumasını bitirmediysen hatırlatma tekrarlanır."], ["Namaz vakitleri de var mı?", "Evet, bulunduğun il ve ilçeye göre Diyanet namaz vakitleri gösterilir."]],
  mihver: [FREE_TR, ["Mihver hangi uygulamaların yerini alır?", "Namaz vakitleri, ilaç hatırlatma, su ve uyku takibi gibi ayrı ayrı kullandığın uygulamaları tek bir günlük düzende birleştirir."], ["Sabah namazına kalkmama yardım eder mi?", "Evet. Zorunlu alarm, soruları çözmeden susmaz."], ["Namaz vakitleri nasıl hesaplanıyor?", "Bulunduğun ilçenin koordinatına göre; ilçeden ilçeye değişen dakikalar dikkate alınır."]],
  sukur: [FREE_TR, ["Şükür ne yapar?", "Gün içinde seçtiğin saatlerde kısa bildirimlerle fark etmediğin nimetleri hatırlatır."], ["Kaç bildirim gelir?", "Günde 1 ile 8 arasında, istediğin saatlerde."], ["İnternet gerekiyor mu?", "Hayır. 1875 metnin tamamı uygulamanın içindedir."]],
  cark: [FREE_TR, ["Çekiliş nasıl çalışır?", "Katılımcıları girip çarkı çevirirsin; her çevirişte çıkan kişi listeden düşer, sonunda tam sıralama oluşur."], ["Hazır şablon var mı?", "Evet: Ne Yesek?, Ne İzlesek?, Nereye Gitsek?, Kimin Sırası? gibi 7 hazır şablon vardır."], ["Kendi çarkımı kurabilir miyim?", "Evet; isim, ikon ve istediğin kadar seçenekle."]],
  walkup: [FREE_TR, ["Alarm sessiz modda çalar mı?", "Evet. WalkUp sessiz modu ve Rahatsız Etmeyin'i aşar; uygulama kapalıyken de çalar."], ["Alarmı nasıl kapatırım?", "Birkaç basit soruyu cevaplarsın; istersen ardından 10–30 adım yürümen gerekir."], ["Erteleme düğmesi var mı?", "Hayır. Sistem alarmını durdurmak yalnızca erteler; görevi bitirene kadar alarm geri gelir."]],
  "sakin-nokta": [FREE_TR, ["Sakinlik skoru nedir?", "Her mekanın ne kadar sakin olduğunu gösteren puandır; günün hangi saatinde daha tenha olduğu da grafikte görünür."], ["Hangi şehirlerde çalışır?", "Türkiye ve Avrupa'dan 1.800'den fazla mekan hazırdır; OpenStreetMap aramasıyla istediğin bölgeye genişletebilirsin."], ["Kendi yerimi ekleyebilir miyim?", "Evet, keşfettiğin sakin yeri not ekleyerek kendi listene kaydedebilirsin."]],
  "rota-planlayici": [FREE_TR, ["Hangi ülkeler var?", "35 ülke ve 203 şehir için hazır mekan kataloğu bulunur."], ["Rota nasıl oluşuyor?", "Seçtiğin yerler konumlarına, gezme sürelerine ve önceliklerine göre günlere otomatik dağıtılır."], ["Google Maps ile kullanabilir miyim?", "Evet, günlük rotanı tek dokunuşla Google Maps'te açabilirsin."]],
  hereafter: [FREE_EN, ["Is my data uploaded anywhere?", "No. Nothing leaves your phone: no servers, no accounts and no internet required."], ["What can I leave behind?", "Letters to each person, voice and video messages, your wishes, debts and vital information, all collected into a Legacy File PDF."], ["Can I lock the app?", "Yes, with Face ID or your fingerprint."]],
  tally: [FREE_EN, ["Who is Tally for?", "Small merchants such as grocers, bakers, butchers and corner shops who keep a customer credit ledger."], ["Can I remind customers to pay?", "Yes. Send a WhatsApp reminder with their balance in one tap."], ["Where is my data stored?", "Only on your device. No internet, account or cloud is needed; you can back up and restore with a JSON file."]],
  "dodge-arena": [FREE_TR, ["İnternetsiz oynanır mı?", "Evet, oyun tamamen internetsizdir ve reklam içermez."], ["Kaç seviye var?", "Her seviyede toplar hızlanır ve arena küçülür; hedef 10. seviyeye ulaşmak."], ["Selfie modu nedir?", "Oyunu kendi yüzünle oynamanı sağlayan bir mod."]],
  "hocaya-sor": [FREE_TR, ["Sorularımı kim cevaplıyor?", "Uzman hocalar sorunu inceler ve ayrıntılı bir cevap yazar; cevap hazır olduğunda bildirim alırsın."], ["Hangi konularda soru sorabilirim?", "Fıkıh ve ibadet, Kur'an ve tefsir, hadis ve sünnet, akaid, helal ve haram, aile ve nikâh, güncel dini meseleler."], ["Abonelik var mı?", "Hayır, tamamen ücretsizdir."]],
  detoks: [FREE_TR, ["Uygulamaları nasıl kilitliyor?", "Kilitleri Apple'ın Ekran Süresi altyapısı koyar; Dijital Detoks hangi uygulamaları kullandığını göremez."], ["Kilit nasıl açılır?", "Belirlediğin koşulu yerine getirince: örneğin 20 dk Duolingo, 3.000 adım ya da 25 dk telefonsuz odak."], ["Hesap veya sunucu var mı?", "Hayır. Hesap, reklam ve sunucu yoktur; tüm veriler cihazında kalır."]],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function descToHtml(text) {
  const out = []; let list = null;
  const flush = () => { if (list) { out.push("<ul>" + list.map((l) => `<li>${esc(l)}</li>`).join("") + "</ul>"); list = null; } };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const m = line.match(/^(?:[•\-■]|\d+\.)\s*(.*)$/);
    if (m && !/^■/.test(line)) { (list ||= []).push(m[1]); continue; }
    flush();
    const h = line.replace(/^■\s*/, "");
    if (h.length < 60 && h === h.toLocaleUpperCase("tr") && /\p{L}/u.test(h)) out.push(`<h2>${esc(h.charAt(0) + h.slice(1).toLocaleLowerCase("tr"))}</h2>`);
    else out.push(`<p>${esc(line)}</p>`);
  }
  flush(); return out.join("\n");
}

const apps = [];
for (const [id, a] of Object.entries(M)) {
  const d = D[id];
  const isTr = a.locales.tr && !["hereafter"].includes(a.slug) && a.slug !== "tally";
  const lang = isTr ? "tr" : "en";
  const pl = isTr ? (a.locales.tr) : (a.locales["en-US"]);
  const descLoc = isTr ? "tr" : "en-US";
  const desc = (pl.description) || d.loc[descLoc]?.description || Object.values(d.loc)[0].description;
  const store = `https://apps.apple.com/${isTr ? "tr" : "us"}/app/id${id}`;
  const url = `${BASE}/uygulamalar/${a.slug}/`;
  const title = `${pl.name} — iPhone uygulaması`.replace("— iPhone uygulaması", isTr ? "— iPhone uygulaması" : "— iPhone app");
  const metaDesc = (pl.subtitle + ". " + desc.split("\n").find((l) => l.trim().length > 40)).slice(0, 158);
  const faq = FAQ[a.slug];
  const ld = [{
    "@context": "https://schema.org", "@type": "MobileApplication", name: pl.name, operatingSystem: "iOS",
    applicationCategory: CAT[a.slug], description: metaDesc, url, downloadUrl: store, installUrl: store,
    inLanguage: lang, offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
    author: { "@type": "Person", name: "Sefa Çotur", url: "https://sefacotur.com" },
    publisher: { "@type": "Person", name: "Sefa Çotur" },
  }, {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })),
  }];
  const T = isTr
    ? { dl: "App Store'dan indir", faq: "Sık sorulan sorular", priv: "Gizlilik politikası", sup: "Destek ve iletişim", all: "Tüm uygulamalar", dev: "Geliştirici" }
    : { dl: "Download on the App Store", faq: "Frequently asked questions", priv: "Privacy policy", sup: "Support and contact", all: "All apps", dev: "Developer" };
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="apple-itunes-app" content="app-id=${id}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(pl.name)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="../../_shared.css">
<style>.cta{display:inline-block;background:var(--accent);color:var(--bg);padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;margin:20px 0 8px}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<main>
<nav class="langnav"><a href="../">${T.all}</a></nav>
<h1>${esc(pl.name)}</h1>
<p class="lede">${esc(pl.subtitle)}</p>
<a class="cta" href="${store}">${T.dl}</a>
${descToHtml(desc)}
<h2>${T.faq}</h2>
${faq.map(([q, ans]) => `<h3>${esc(q)}</h3>\n<p>${esc(ans)}</p>`).join("\n")}
<footer>
<p><a href="${store}">${T.dl}</a> · <a href="${PRIVACY[a.slug]}">${T.priv}</a> · <a href="${BASE}/destek/">${T.sup}</a></p>
<p>${T.dev}: <a href="https://sefacotur.com">Sefa Çotur</a></p>
</footer>
</main>
</body>
</html>
`;
  const dir = path.join(OUT, "uygulamalar", a.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  apps.push({ id, slug: a.slug, name: pl.name, subtitle: pl.subtitle, url, store, lang, summary: metaDesc, faq });
}

// Katalog
const cat = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sefa Çotur'un iPhone uygulamaları</title>
<meta name="description" content="Zikirmatik, Kur'an meali, Risale-i Nur, İngilizce öğrenme, uygulama kilidi, alarm ve gezi planlama: Sefa Çotur'un ücretsiz iPhone uygulamaları.">
<link rel="canonical" href="${BASE}/uygulamalar/">
<link rel="stylesheet" href="../_shared.css">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: apps.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: a.url, name: a.name })) })}</script>
</head>
<body>
<main>
<h1>iPhone uygulamaları</h1>
<p class="lede">Sefa Çotur tarafından geliştirilen ücretsiz iOS uygulamaları. / Free iOS apps by Sefa Çotur.</p>
<ul>
${apps.map((a) => `  <li><a href="${a.slug}/"><strong>${esc(a.name)}</strong></a> — ${esc(a.subtitle)}</li>`).join("\n")}
</ul>
<footer><p><a href="../">Gizlilik politikaları / Privacy policies</a> · <a href="../destek/">Destek / Support</a></p></footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, "uygulamalar", "index.html"), cat);

// sitemap, robots, llms.txt
const urls = [`${BASE}/`, `${BASE}/uygulamalar/`, ...apps.map((a) => a.url), `${BASE}/destek/`];
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "llms.txt"), `# Sefa Çotur — iPhone uygulamaları

> Sefa Çotur'un App Store'daki ücretsiz iOS uygulamaları. Hepsi ücretsizdir; uygulama içi satın alma veya abonelik yoktur. Arayüzlerin çoğu Türkçedir.

## Uygulamalar

${apps.map((a) => `- [${a.name}](${a.url}): ${a.subtitle}. App Store: ${a.store}`).join("\n")}

## Sık sorulan sorular

${apps.map((a) => `### ${a.name}\n${a.faq.map(([q, ans]) => `- ${q} ${ans}`).join("\n")}`).join("\n\n")}

## Diğer

- [Destek ve iletişim](${BASE}/destek/)
- [Gizlilik politikaları](${BASE}/)
`);
console.log("yazıldı:", apps.length, "uygulama");
