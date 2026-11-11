# المتطلب الثالث: الأداء والتخزين المؤقت — خطوات التشغيل والقياس

القاعدة: **قِس أولاً، ثم حسّن، ثم قِس مرة أخرى.**

## 0) التجهيز

```bash
# 1) ضيف سطور perf/env-additions.txt إلى .env
# 2) أعد البناء (أضفنا php-redis) وشغّل
docker compose up -d --build

# 3) بيانات بحجم حقيقي (بياخد كم دقيقة)
docker compose exec app php artisan perf:seed            # 2000 مستخدم + 20000 منتج + 300000 طلب
```

حساب الاختبار: `perf1@example.com` / `Password123`.

## 1) القياس "قبل" (بدون أي تحسين)

أوقف كل التحسينات بالـ `.env`:

```
CACHE_STORE=database
PERF_PRODUCT_CACHE=false
PERF_HTTP_CACHE=false
DB_READ_HOST=db
```

وارجع الفهارس لوضعها القديم، وأعد تشغيل التطبيق:

```bash
docker compose exec app php artisan migrate:rollback --step=3
docker compose up -d app            # يقرأ الـ .env من جديد
docker compose exec app php artisan perf:explain --runs=30      # احفظ الجدول
docker compose --profile perf run --rm k6 run -e LABEL=before -e PRODUCT_MAX_ID=500 /perf/k6/load-test.js
```

> compose بيقرأ `CACHE_STORE` من `.env` (الافتراضي redis)، فتغييرها بالـ `.env` كافي. شغّل `docker compose up -d app queue` بعد أي تغيير.

## 2) القياس "بعد"

```
CACHE_STORE=redis
PERF_PRODUCT_CACHE=true
PERF_HTTP_CACHE=true
```

```bash
docker compose exec app php artisan migrate               # الفهارس الجديدة
docker compose up -d app
docker compose exec app php artisan perf:explain --runs=30      # قارن مع "قبل"
docker compose --profile perf run --rm k6 run -e LABEL=after -e PRODUCT_MAX_ID=500 /perf/k6/load-test.js
docker compose --profile perf run --rm k6 run -e LABEL=after_etag -e CONDITIONAL=true -e PRODUCT_MAX_ID=500 /perf/k6/load-test.js
```

النتائج بتنحفظ بـ `perf/results/<LABEL>.json` وبتنطبع بالـ terminal (p50 / p95 / p99 / req per sec).

## 3) نسخة القراءة (Read Replica)

```bash
# بالـ .env:  DB_READ_HOST=db-replica
docker compose --profile replica up -d          # يشغّل db-replica ويربطها (replica-setup)
docker compose logs replica-setup               # لازم يطلع: replica is ready
docker compose up -d app
```

### إثبات "المستخدم بيشوف اللي أنشأه للتو" رغم تأخر النسخة

```bash
# أوقف تطبيق التعديلات على النسخة (بنحاكي التأخر)
docker compose exec db-replica mysql -uroot -proot_docker_password -e "STOP REPLICA SQL_THREAD;"

# أنشئ طلب (POST /orders بتوكن زبون) ثم افتح GET /orders فوراً:
#   -> الطلب الجديد ظاهر (لأنو الـ middleware ReadYourWrites وجّه القراءة للأساسية)
# انتظر أكتر من 5 ثواني ثم افتح GET /orders:
#   -> الطلب مو ظاهر (قراءة من النسخة المتأخرة) وهاد بيثبت إنو التثبيت هو اللي كان شغّال

docker compose exec db-replica mysql -uroot -proot_docker_password -e "START REPLICA SQL_THREAD;"
#   -> بعد ثواني الطلب بيظهر عادي
```

## 4) إثبات "تعديل المنتج بيظهر فوراً رغم الكاش والنسخة"

```bash
docker compose exec app php artisan test --filter=PerformanceCachingTest
```

أو يدوياً: `GET /products/1` (انسخ ETag) ثم `PUT /products/1` كأدمن ثم `GET /products/1` →
الاسم الجديد 200 فوراً، و`GET` مع `If-None-Match` بالبصمة القديمة بيرجع 200 (مو 304).

## جدول النتائج (عبّيه من خرج k6)

| المقياس | قبل التحسين | بعد التحسين | بعد + ETag |
|---|---|---|---|
| زمن الاستجابة p50 (ms) | | | |
| زمن الاستجابة p95 (ms) | | | |
| زمن الاستجابة p99 (ms) | | | |
| عدد الطلبات بالثانية | | | |
| بيانات مستلمة (MB) | | | |

## أسئلة الشرائح

- **ما الذي يبطّئ الفهرس؟** كل `INSERT/UPDATE/DELETE` لازم يحدّث كل فهرس على الجدول، والفهارس بتاخد مساحة وذاكرة،
  والفهرس المركّب ما بينفع إلا لما الاستعلام بيبدأ بأعمدته الأولى (و`LIKE '%x%'` ما بيستفيد من أي فهرس).
  لهيك حذفنا فهارس `category` و`user_id` القديمة (صارت زيادة) وما أضفنا فهرس على `order_items.product_id` لأنو ما في استعلام بيحتاجه.
- **ما الذي يجوز تخزينه؟** بيانات عامة بتنقرأ كتير وبتتغير قليلاً (المنتجات). **ما الذي لا يجوز؟** بيانات خاصة بمستخدم
  (طلباته، إشعاراته، التوكن)، أو بيانات لازم تكون لحظية بدقة، أو نتائج بحث كتيرة التنوع.
