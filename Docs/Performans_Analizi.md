# 🚀 Oyun Performansı Darboğaz Analizi

Oyunun kod tabanını, sahne yönetimini (`update` döngüleri), bellek (memory) kullanım şekillerini ve Phaser.js ayarlarını detaylıca inceledim. Oyun genel olarak çok iyi bir Event-Driven (olay güdümlü) mimariye sahip olduğu için her saniye çalışan ağır hesaplamalar (`update()` döngü ağrılığı) **bulunmuyor.** 

Buna rağmen oyunda hissedilen kasma/donma ve mikro-stutter (anlık takılma) durumlarının temel sebepleri şunlardır:

## 1. Kart Dönme Animasyonundaki Darboğaz (Phaser Text Rendering)
**Dosya:** `src/ui/Card.ts` -> `flipToFront()` metodu
**Sorun:** Kart ilk kez döndürüldüğünde, kartın ön yüzündeki `Text` nesnesi (başlık yazısı) eş zamanlı olarak oluşturuluyor (`this.scene.add.text()`). HTML5 Canvas (ve WebGL) teknolojilerinde "Text" oluşturmak **en ağır işlemlerden biridir** çünkü arka planda gizli bir canvas oluşturulur, yazı o canvas'a çizilir ve daha sonra bu çizim GPU'ya bir "Texture (Doku)" olarak yüklenir. 
Animasyon oynarken bu işlemin yapılması cihazın GPU ve CPU'sunu anlık olarak bloke eder ve "kasma/takılma" hissiyatına yol açar.
**Çözüm:** Bu Text ve Image nesneleri kart animasyonu başladığında değil, `Card` ilk defa oluşturulurken (`constructor` içinde) yaratılmalı ve sadece `setVisible(false)` ile gizli tutulmalıdır. Animasyon esnasında sadece görünürlükleri açılmalıdır (Object Preloading).

## 2. Her Seviyede Çöp Toplayıcı (Garbage Collection / GC) Yükü
**Dosya:** `src/scenes/GamePlayScene.ts` -> `createCardGrid()` ve `shutdown()`
**Sorun:** Oyuncu her yeni seviyeye geçtiğinde, ekrandaki tüm eski kartlar `destroy()` ediliyor ve yenileri en baştan `new Card(...)` ile tekrar oluşturuluyor. JavaScript ve Phaser motorunda sürekli olarak yüzlerce kompleks Container ve Texture nesnesini yok edip baştan yaratmak, bellek parçalanmasına ve "Garbage Collection (Çöp Toplayıcı)" sivrilmelerine (spike) neden olur. GC çalıştığı an oyun milisaniyeler boyunca donar.
**Çözüm:** Nesne Havuzu (Object Pool) kullanılmalıdır. Kartlar yok edilmek yerine görünmez yapılarak bir "havuza" alınmalı ve yeni seviyede bu kartlardaki sadece resimler ve yazılar değiştirilerek tekrar kullanılmalıdır.

## 3. Battery Optimizer Kesintileri
**Dosya:** `src/utils/BatteryOptimizer.ts`
**Sorun:** Cihazda arka plana geçildiğinde oyun FPS'i 30'a düşürülüyor. Ancak bazı mobil tarayıcılarda `visibilitychange` olayı (cihaz üst menüsü çekildiğinde veya reklam açıldığında) yanlış veya agresif tetiklenebiliyor. Bu durum oyunun anlık olarak zorla 30 FPS'e kilitlenmesine ve kasma gibi görünmesine sebep olabilir.
**Çözüm:** Optimizatördeki FPS düşürme stratejisi (reklam izleme durumlarıyla çakışıp çakışmadığı kontrol edilerek) gözden geçirilmeli veya oyun aktifken kesinlikle `60 FPS` garantilenmelidir.

## 4. Kullanılmayan TweenPool Sınıfı
**Dosya:** `src/utils/TweenPool.ts`
**Sorun:** Hazırlanmasına rağmen bu sınıf projede kullanılmıyor. Animasyonların yarattığı Tween nesneleri bir havuza konuyor ama `get()` çağrıldığında sistem her zaman `scene.tweens.add` ile sıfırdan oluşturuyor. Bu kullanılmayan bir bellek sızıntısıdır.
**Çözüm:** TweenPool sistemi silinmeli veya gerçekten Phaser 3 mimarisine uygun bir şekilde optimize edilmelidir.

---
### 💡 Özet Çözüm Planı (Aksiyonlar):
En büyük kasma kaynağı **1. maddedeki (Kart Döndürme)** sorundur. Sadece o değiştirildiğinde bile oyundaki tepkisellik (smoothness) devasa oranda artacaktır. İkinci adım olarak kart nesne havuzu eklenebilir.
