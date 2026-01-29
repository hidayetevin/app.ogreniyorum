# Android App Bundle (AAB) Oluşturma Rehberi

Google Play Store'da uygulama yayınlamak için modern ve önerilen format **Android App Bundle (.aab)** formatıdır. APK yerine AAB kullanmak, uygulamanın boyutunu küçültür ve farklı cihazlar için optimize edilmesini sağlar.

## Adım Adım AAB Oluşturma

### 1. Android Studio'yu Açın
Projenizin `android` klasörünü Android Studio ile açın.

### 2. İmzalı Bundle Oluşturma Menüsü
Üst menüden şu yolu izleyin:
`Build` > `Generate Signed Bundle / APK...`

### 3. Format Seçimi
Açılan pencerede **Android App Bundle** seçeneğini işaretleyin ve `Next` butonuna tıklayın.

### 4. Keystore (İmza Dosyası) Ayarları
Bu adım çok önemlidir. Uygulamanızı imzalamak için bir "Keystore" dosyasına ihtiyacınız var.

*   **Eğer daha önce bir Keystore dosyanız varsa:** `Choose existing...` diyerek dosyanızı seçin ve şifrelerini girin.
*   **İlk kez oluşturuyorsanız:**
    1.  `Create new...` butonuna tıklayın.
    2.  **Key store path:** Dosyanın kaydedileceği yeri seçin (Projeden güvenli bir yerde saklayın, kaybetmeyin!).
    3.  **Password:** Güçlü bir şifre belirleyin ve onaylayın. H.evin180824
    4.  **Key > Alias:** Genellikle "key0" veya uygulama adı olabilir.
    5.  **Key > Password:** Anahtar için de şifre belirleyin (Keystore şifresi ile aynı olabilir).
    6.  **Certificate:** "First and Last Name" kısmına kendi adınızı veya şirket adınızı yazın, diğerlerini boş bırakabilirsiniz.
    7.  `OK` diyerek pencereyi kapatın.

Bilgiler doldurulduktan sonra aşağıdakileri yapın:
*   [x] **Remember passwords** kutucuğunu işaretleyin (kolaylık sağlar).
*   [x] **Export encrypted key for enrolling published apps in Google Play App Signing** kutucuğunu işaretleyebilirsiniz (önerilir).
*   `Next` butonuna tıklayın.

### 5. Build Varyantı Seçimi
*   **Destination Folder:** Çıktı klasörünü olduğu gibi bırakabilir veya masaüstüne alabilirsiniz.
*   **Build Variants:** `release` seçeneğini seçin.
*   `Finish` (veya `Create`) butonuna tıklayın.

### 6. İşlemin Tamamlanması
Android Studio sağ alt köşede "Gradle Build Running" işlemini gösterecektir. İşlem tamamlandığında bir bildirim çıkar:
> "Generate Signed Bundle: App Bundle(s) generated successfully for module 'app' with 1 build variant."

Bildirimdeki **locate** bağlantısına tıklayarak `.aab` dosyasının olduğu klasörü açabilirsiniz. Dosya genellikle şurada bulunur:
`android/app/release/app-release.aab`

### 🎉 Tebrikler!
Bu `app-release.aab` dosyasını Google Play Console'a yükleyebilirsiniz.

---
**⚠️ ÖNEMLİ UYARI:** Oluşturduğunuz **Keystore dosyasını (.jks veya .keystore) ve şifrelerini ASLA KAYBETMEYİN.** Eğer kaybederseniz, uygulamanıza güncelleme gönderemezsiniz ve Play Store'da yeni bir sayfa açmak zorunda kalırsınız.
