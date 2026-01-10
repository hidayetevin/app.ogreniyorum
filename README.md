# Çocuk Resim Eşleştirme Oyunu 🎮

4-10 yaş arası çocuklar için geliştirilmiş, eğlenceli ve eğitici bir web tabanlı hafıza oyunu.

## 🎯 Özellikler

- **Çoklu Kategori**: Hayvanlar, meyveler, araçlar ve daha fazlası
- **Zorluk Seviyeleri**: Kolay, orta ve zor seviyeler
- **İlerleme Sistemi**: Yıldız toplama ve kategori kilitleme
- **Çok Dilli**: Türkçe ve İngilizce desteği
- **Erişilebilirlik**: Renk körlüğü modu ve ses kapalı desteği
- **Ebeveyn Kontrolü**: Güvenli oyun deneyimi için ebeveyn paneli
- **Responsive Tasarım**: Tüm cihazlarda çalışır

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda açın: `http://localhost:3000`

## 📦 Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview

# Linting
npm run lint
npm run lint:fix

# Kod formatlama
npm run format

# Type checking
npm run type-check

# Testler
npm test
npm run test:coverage
```

## 🏗️ Proje Yapısı

```
src/
├── assets/          # Görseller ve sesler
├── config/          # JSON konfigürasyonları
├── constants/       # Sabitler
├── core/            # Core servisler
│   ├── AudioService.ts
│   ├── FeedbackService.ts
│   ├── StorageService.ts
│   ├── LevelService.ts
│   ├── AnalyticsService.ts
│   └── LocalizationService.ts
├── scenes/          # Phaser sahneleri
│   ├── BootScene.ts
│   ├── MainMenuScene.ts
│   ├── CategorySelectionScene.ts
│   ├── GamePlayScene.ts
│   └── LevelCompleteScene.ts
├── types/           # TypeScript tipleri
├── ui/              # UI bileşenleri
│   ├── Button.ts
│   └── Card.ts
├── utils/           # Yardımcı fonksiyonlar
├── locales/         # Çeviri dosyaları
└── main.ts          # Giriş noktası
```

## 🎨 Teknolojiler

- **Phaser.js 3.80+**: Oyun motoru
- **TypeScript**: Tip güvenli geliştirme
- **Vite**: Hızlı build tool
- **ESLint & Prettier**: Kod kalitesi
- **Vitest**: Test framework

## 🧪 Testler

Testler Vitest ile yazılmıştır:

```bash
npm test
```

Coverage raporu için:

```bash
npm run test:coverage
```

## 📝 Lisans

MIT

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 🎯 Gelecek Özellikler

- [ ] Daha fazla kategori
- [ ] Multiplayer modu
- [ ] Liderlik tablosu
- [ ] Özel tema desteği
- [ ] PWA desteği
- [ ] Mobil uygulama

## 📧 İletişim

Sorularınız için issue açabilirsiniz.
