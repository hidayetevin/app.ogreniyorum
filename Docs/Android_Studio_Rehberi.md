# Android Studio Kullanım Rehberi 📱

Bu rehber, Capacitor ile oluşturulmuş Android projesini Android Studio'da nasıl açacağınızı ve APK alacağınızı adım adım açıklar.

## 1. Hazırlık
Android Studio bilgisayarınızda kurulu olmalıdır. Eğer kurulu değilse [buradan](https://developer.android.com/studio) indirebilirsiniz.

## 2. Projeyi Açma
1.  **Android Studio**'yu başlatın.
2.  Hoş geldiniz ekranında **"Open"** (veya **"File > Open"**) seçeneğine tıklayın.
3.  Bilgisayarınızda projenin bulunduğu konuma gidin:  
    `C:\Users\hiday\Desktop\çocuk oyun\Proje_Dosyaları`
4.  Bu klasörün içindeki **`android`** klasörünü seçin ve **"OK"** butonuna basın.

> [!IMPORTANT]
> Proje açıldığında sağ altta "Gradle Sync" işlemi başlayacaktır. Bu işlemin tamamlanmasını bekleyin. İnternet hızınıza göre birkaç dakika sürebilir.

## 3. APK Oluşturma (Build)
1.  Üst menü çubuğundan **Build** sekmesine tıklayın.
2.  **Build Bundle(s) / APK(s)** seçeneğinin üzerine gelin.
3.  Açılan menüden **Build APK(s)** seçeneğine tıklayın.
4.  Derleme işlemi bittiğinde sağ alt köşede bir bildirim görünecek. Buradaki **"locate"** bağlantısına tıklayarak oluşturulan `.apk` dosyasına ulaşabilirsiniz.

## 4. Gerçek Cihazda veya Emülatörde Çalıştırma
*   **Emülatör**: Üst araç çubuğundaki cihaz listesinden bir "Virtual Device" seçin ve yeşil **"Play"** (Run) butonuna basın.
*   **Gerçek Cihaz**: USB hata ayıklama modu açık bir Android telefonu bilgisayara bağlayın, cihaz listesinden seçin ve **"Play"** butonuna basın.

## 5. Web Kodlarını Güncelledikten Sonra (Önemli!)
Eğer VS Code tarafında web kodlarında (JS/TS/HTML/CSS) bir değişiklik yaparsanız, bu değişikliklerin Android Studio'ya yansıması için terminalde şu komutu çalıştırmalısınız:

```bash
npm run build; npx cap sync android
```

Bu komuttan sonra Android Studio'da tekrar Build APK demeniz yeterlidir.
