# المتطلب الرابع: الطوابير والتحديثات اللحظية (مشروع e-commerce)

## وين أفضل مكان نطبّقو؟
على **عملية إنشاء الطلب** اللي موجودة من المتطلب الثاني، من غير ما نلمس `OrderService` أبداً.
مشروعك أصلاً بيطلق حدثين: `OrderPlaced` و `OrderStatusChanged`، فنربط عليهم:

| الحدث | طابور RabbitMQ (الخلفية) | WebSocket عبر Reverb (اللحظي) |
|---|---|---|
| `OrderPlaced` | بريد تأكيد حقيقي للزبون (العامل بيرسله) | قناة `admin.orders` ← الطلب بيظهر فوراً عند الأدمن |
| `OrderStatusChanged` | – | قناة `orders.{id}` ← حالة الطلب بتتغير فوراً عند الزبون |

قرار تصميم مهم: **البث اللحظي مو بالطابور**، فيشتغل حتى لو العامل واقف (هاد اللي بيطلبوه بالمقابلة: توقف العامل والأدمن لسا بيشوف الطلب فوراً). والبريد بس هو اللي بالطابور.

## نسخ الملفات
انسخ محتوى مجلد `req4/` فوق جذر المشروع (بنفس المسارات). الملفات الجديدة:
- `backend/app/Modules/Notifications/Listeners/SendOrderConfirmationEmail.php`: يدخل الطابور `emails` على RabbitMQ، `tries=5`، backoff 10/30/60/120 ثانية، و`failed()` للـ DLQ
- `backend/app/Modules/Notifications/Mail/OrderConfirmationMail.php` + `backend/resources/views/emails/order-confirmation.blade.php`
- `backend/app/Modules/Realtime/**`: أحداث البث، الـ listener، والـ provider (فيه مسار `/api/v1/broadcasting/auth` وصلاحيات القناتين)
- `backend/config/broadcasting.php`
- `backend/tests/Feature/Api/AsyncAndRealtimeTest.php`
- `src/shared/lib/realtime.ts`, `src/features/orders/hooks/useOrderRealtime.ts`

وملفات معدّلة (بالـ zip نسخ كاملة، وبـ `المتطلب_الرابع.patch` الفروقات فقط): `compose.yaml` (خدمات `rabbitmq` و`worker` و`reverb`)، `config/queue.php`، `config/mail.php`، `phpunit.xml`، `bootstrap/providers.php`، `NotificationsServiceProvider.php`، `.env.example`، وبالفرونت: `AdminOrdersPage`, `CustomerOrdersPage`, `AuthContext`, `ordersService`, `env.ts`, `package.json`.

## خطوات التشغيل
1. **حزمتا PHP** (بيحدّثوا `composer.json` و`composer.lock`):
   ```bash
   cd backend
   docker compose run --rm --no-deps -e RUN_DATABASE_SETUP=false app \
     composer require vladimir-yuldashev/laravel-queue-rabbitmq:^15.0 laravel/reverb
   ```
2. **البريد الحقيقي**: بـ `backend/.env` حط بيانات SMTP حقيقية (Brevo أو Gmail مع App Password): `MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD / MAIL_FROM_ADDRESS` (شوف `.env.example`). ما بتنكتب بالكود ولا بتنرفع على git.
3. **تشغيل** (الـ `-V` ضروري حتى ما تبقى مكتبات `vendor` القديمة بالـ volume):
   ```bash
   docker compose up -d --build -V
   ```
   واجهة RabbitMQ: http://localhost:15672 (guest/guest). Reverb: المنفذ 8080.
4. **الفرونت**: `npm install` ثم `npm run dev`. قيم `VITE_REVERB_*` انضافت لـ `.env` (المتصفح بيوصل `localhost:8080`، بينما Laravel بيوصل `reverb:8080` من داخل docker).
5. الاختبارات: `docker compose exec app php artisan test --filter=AsyncAndRealtimeTest`

## سيناريو المقابلة
1. `docker compose stop worker` ← زبون بيعمل 3 طلبات: الرد فوري، والأدمن بيشوفهم فوراً، وبواجهة RabbitMQ بتلاقي 3 رسائل بطابور `emails`.
2. `docker compose start worker` ← بتوصل 3 رسائل بريد حقيقية والطابور بيفضى.
3. الحلقة الكاملة: متصفحان (زبون + أدمن)؛ الأدمن بيضغط Accept والحالة بتتغير عند الزبون بدون تحديث.
4. إثبات DLQ: غلّط `MAIL_PASSWORD` وأعد تشغيل `worker`، اعمل طلب ← بعد استنفاد المحاولات الرسالة بتظهر بطابور `emails.dlq` (وبجدول `failed_jobs`).

## أسئلة محتملة
- **تعطل العامل بعد إرسال البريد وقبل التأكيد، كم بريد يصل؟** RabbitMQ بيسلّم "مرة على الأقل"، فالرسالة بتنعاد. منعنا التكرار بعلامة `mail:order-confirmation:{id}` بـ Redis، لكن بالنافذة الضيقة بين الإرسال وحفظ العلامة ممكن بريدان. التسليم "مرة وحدة بالضبط" مستحيل عملياً، لهيك الحل idempotency.
- **ليش DLQ؟** حتى الرسالة اللي بتفشل دائماً ما تعلّق الباقي ولا تضيع. الإعداد: `reroute_failed` بـ `config/queue.php`، والـ DLX اسمو `dlx` مربوط بطابور `emails.dlq` (بيتجهزوا بأمر الـ worker).
- **ليش قناتين بشروط مختلفة؟** الأدمن بالدور (`isAdmin`)، والزبون بالملكية (`user_id`)؛ بدون الملكية زبون ممكن يتجسس على طلب غيره.

## حدود لازم تعرفها
- ما قدرت أشغّل المشروع كامل هون (ما في وصول لـ Packagist/Docker). اللي تحققت منه: فحص syntax لكل ملفات PHP، `tsc` و`vite build` للفرونت، وقراءة كود حزمة RabbitMQ لأتأكد كيف بتتعامل مع الفشل (`markAsFailed` ← reject ← DLX). **الاختبارات الجديدة ما انشغّلت**؛ شغّلها وبلّغني بأي خطأ.
- إذا RabbitMQ كان واقع لحظة إنشاء الطلب: الطلب بينحفظ والرد بيرجع، لكن البريد ما بينحط بالطابور (بيتسجل خطأ). الحل الكامل هو نمط Outbox (تطوير ممكن، مو مطلوب).
- أخطاء eslint القديمة بالمشروع (~100) مو من تعديلي؛ ملفاتي ما زوّدت منها شي.
