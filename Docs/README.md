# 🚀 Çocuk Resim Eşleştirme Oyunu - Çalıştırma Kılavuzu

Bu dosya, projenin yerel ortamda nasıl kurulacağı, çalıştırılacağı ve geliştirileceği ile ilgili temel bilgileri içerir.

## 📋 Gereksinimler

Projenin çalışması için bilgisayarınızda aşağıdaki yazılımların kurulu olması gerekir:

- **Node.js**: v18 veya daha yeni bir sürüm.
- **npm**: Node.js ile birlikte otomatik olarak yüklenir.

## 🛠️ Kurulum

Projeyi ilk kez açtığınızda veya yeni bir bağımlılık eklendiğinde paketleri yüklemeniz gerekir:

```bash
npm install
```

## 🚀 Oyunu Başlatma

Geliştirme sunucusunu başlatmak ve oyunu tarayıcıda görmek için:

```bash
npm run dev
```

Komut çalıştıktan sonra oyuna aşağıdaki adresten erişebilirsiniz:
👉 **[http://localhost:3000](http://localhost:3000)**

## 📦 Diğer Komutlar

Aşağıdaki komutları terminalinizde çalıştırarak projenin farklı özelliklerini kullanabilirsiniz:

### 🔨 Yayına Hazırlama (Build)
Oyunu yayına hazır bir bundle haline getirmek için:
```bash
npm run build
```
Çıktılar `dist/` klasöründe oluşturulur.

### 🧪 Testleri Çalıştırma
Yazılan birim testlerini kontrol etmek için:
```bash
npm test
```

### 🧹 Kod Standartları (Linting)
Kodun standartlara uygunluğunu kontrol etmek ve basit hataları düzeltmek için:
```bash
npm run lint
```

### 📝 Dokümantasyon
Bu kılavuzun yanı sıra `Docs/` dizini altında aşağıdaki dosyalar da bulunmaktadır:
- **Proje_Dokümantasyonu.md**: Teknik mimari ve detaylı açıklamalar.
- **Walkthrough.md**: Proje gelişim süreci ve test sonuçları.
- **Teknik_Analiz.txt**: İlk planlama ve gereksinimler.

---
*İyi eğlenceler!* 🎮
