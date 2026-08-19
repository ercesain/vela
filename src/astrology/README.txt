VELA astrology MVP

Bu klasör bilinçli olarak dependency-free bırakıldı.

1. `types.ts`
   Doğum profili, natal snapshot, güncel gökyüzü, transit ve tarot bağlamı tipleri.

2. `transitRelevance.ts`
   Kullanıcının seçtiği konuya göre en alakalı 2–3 astrolojik sinyali seçer.
   Bu bir ephemeris hesaplayıcısı değildir.

3. `astroContext.ts`
   Natal + current sky + konu bilgisini tek `AstroContext` haline getirir.
   `serializeAstroContextForAI` ile AI'ya kontrollü structured context verir.

Önemli:
- Şimdilik hiçbir API bağlanmadı.
- Hiçbir Expo/package/config değişikliği gerektirmez.
- Gerçek gezegen konumları sonraki adımda backend/ephemeris provider tarafından sağlanmalıdır.
