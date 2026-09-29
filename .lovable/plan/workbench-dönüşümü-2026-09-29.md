# Workbench dönüşümü

## Kapsam

Yüklenen `DESIGN_SYSTEM.md` dosyasını yeni görsel kaynak kabul ederek dönüşümü 0–7 faz sırasıyla uygulayacağım. Mevcut hizmetler, fiyatlar, veriler, sayfa adresleri, rezervasyon mantığı, gizlilik ve otomasyonlar korunacak. Ödeme butonu veya ödeme akışı eklenmeyecek; ücret dosyalamada ödenmeye devam edecek.

## Fazlar

1. **Temel:** Eski serif/kâğıt stilini kaldır; Geist, gri zemin–beyaz yüzeyler, renk ve ölçü sistemini, ortak kontrolleri ve Ready halkasını oluştur.
2. **Ana sayfa:** Ortalanmış arama alanı, hizmet seçenekleri, etkileşimli belge listesi, Priya, yorumlar, gizlilik ve SSS’yi yeni panellere taşı.
3. **Rezervasyon:** Dört adımlı çalışma alanını, sürekli görünen belge listesini, saat seçimini ve “Rezervasyon tamam” ekranını yenile; işleyişi değiştirme.
4. **Müşteri sayfaları:** Randevu, belge yükleme, taşıma, iptal ve imza ekranlarını aynı görsel dile taşı; ödeme ekleme.
5. **Priya’nın alanı:** Sol menü, arama/kısayol, Bugün ve İlgilenmen gerekenler sayfalarını yenile.
6. **Diğer yönetici sayfaları:** Takvim, müşteriler, gönderilenler, sonuçlar, ayarlar ve demo araçlarını aynı sisteme uyarla.
7. **Kontrol:** 390, 768 ve 1440 pikselde görünüm, odak, boş/yükleniyor/hata durumları; rezervasyon, belge ve yönetici akışını uçtan uca doğrula.

## Uygulama notları

- Fontu bu projede HTML dosyasını düzenlemek yerine mevcut sayfa başlığı mekanizmasından yükleyeceğim; sonuç aynı olacak.
- Tasarım dosyasındaki renkleri global tasarım değişkenleriyle kullanacağım; mevcut Tailwind sürümüne uygun şekilde tanımlayacağım.
- Yeni tasarımdaki ödeme önerisi ve “her adımda tek soru” ifadesi, mevcut anında rezervasyon ve tüm soruları bir sayfada gösterme deneyimini değiştirmeyecek.
- Her faz sonunda görünümü ve ilgili akışları kontrol edeceğim; sorunları sonraki faza taşımadan düzelteceğim.