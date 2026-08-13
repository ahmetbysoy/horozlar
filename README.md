# 🐓 Horoz İmparatorluğu — Oynanabilir MVP

`uploads/horoz imparatorluğum.md` dokümanındaki spec'e dayalı, **çalışır durumda** bir Telegram Mini App prototipi.
Bu MVP, dokümandaki 26 oyun sisteminden **çekirdek oynanabilir döngüyü** uygular ve hemen oynanabilir.

## 🎮 Uygulanan Özellikler

| Modül | Durum | Açıklama |
|-------|-------|----------|
| **Genetik & Seed** (§6.1) | ✅ | 16-hex seed üretimi, deterministik stat hesabı, ırk/element/rarity belirleme |
| **Irk Sistemi** (§6.2) | ✅ | CIVIC/ASIL/DENIZLI/MODERN_GAME/LEGENDARY + ırk bonusları ve ırka özel canvas rengi |
| **Stat & Gizli Stat** (§6.3) | ✅ | Power/Speed/Stamina + kritik/kaçınma/panik/geç-oyun-gücü/potansiyel |
| **Rarity Tier** (§6.4) | ✅ | COMMON→LEGENDARY, glow animasyonu |
| **Element** (§6.5) | ✅ | Taş-kağıt-makas hasar çarpanı (×1.5 / ×0.75) |
| **Yetenekler** (§6.6) | ✅ | Irka özel skill (Ezici Darbe, İyileşme, Öfke, Zehir, Kalkan, İlahi) |
| **Dövüş Motoru** (§6.7) | ✅ | Hasar formülü, sıra, kritik, kaçınma, zehir, panik, rage metre, max 10 round |
| **Antrenman** (§6.9) | ✅ | 🪙100 + ⚡10, +1~3, potansiyel sınırı, %20 gizli stat keşfi |
| **Ekonomi** (§6.12) | ✅ | Coin/Diamond, dövüş ödülleri, harcamalar (localStorage kalıcılık) |
| **Pazar** (§6.14) | ✅ | NPC horoz satın alma, rarity fiyat çarpanı |
| **Lig/Arena** (§6.16) | ✅ | 5 lig, lig bazlı ödül + rakip gücü |
| **Görevler** (§6.18) | ✅ | Günlük/haftalık görev + ödül alma |
| **Günlük Ödül** (§6.23) | ✅ | Login streak ödülü |
| **Veteriner** (§6.25) | ✅ | 🪙500 ile tüm gizli özellikleri açma |
| **Dövüş Sonrası Keşif** | ✅ | %30 şansla gizli stat keşfi |

## 🖼️ Canvas Horoz Çizimi
Horozlar ırk + element + rarity renkleriyle HTML5 Canvas üzerinde çizilir. Mutant horozlar renk değiştirir ve animasyonlu olur.

## 🔧 Teknoloji
- Vite + React 18 (ESM)
- Saf CSS (tema değişkenleri + animasyonlar)
- localStorage tabanlı kalıcı save (Firebase gerektirmez)

## 🚀 Çalıştırma
```bash
cd horoz-imparatorlugu
npm install
npm run dev
```
Production build: `npm run build`

## ⏭️ Sonraki Adımlar (spec'ten kalan)
- 🔌 Firebase Auth + Firestore gerçek zamanlı senkronizasyon (`.env` ile)
- 🧬 Füzyon / Üreme / Mutasyon paneli (§6.10, §6.11)
- 🤺 PVP kod paylaşımı (§6.21), ⚖️ Bahis (§6.13)
- 🏰 Klan (§6.19), 👹 Boss savaşları (§6.17), 🎰 Çark (§6.23)
- 🎮 Sezon, Prestij/Miras (§6.20, §6.22)
- 🔊 Web Audio API ses efekleri, Telegram haptic & tema entegrasyonu

## 📝 Not
Doküman Firebase kullanımını öngörüyor. Bu MVP'in **hemen oynanabilir** olması için backend yerine localStorage kullanıldı;
Firebase config'leri (`src/config/`, `.env`) dokümandaki gibi eklendiğinde aynı store mimarisi üzerinden gerçek zamanlı senkronizasyona geçilebilir.
