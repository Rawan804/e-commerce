// اختبار حمل (k6): نفس الاختبار قبل التحسين وبعده، ونقارن p50 / p95 / p99 وعدد الطلبات بالثانية.
//
//   docker compose --profile perf run --rm k6 run -e LABEL=before /perf/k6/load-test.js
//   docker compose --profile perf run --rm k6 run -e LABEL=after  /perf/k6/load-test.js
//   (مع ETag):  ... -e CONDITIONAL=true
//
// متغيرات اختيارية:
//   VUS (افتراضي 30)   DURATION (افتراضي 60s)   PRODUCT_MAX_ID (آخر id منتج، بيطلعه perf:seed)
//   USER_EMAIL / USER_PASSWORD  (حساب زبون عنده طلبات؛ افتراضي perf1@example.com / Password123)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:9000/api/v1';
const LABEL = __ENV.LABEL || 'run';
const CONDITIONAL = (__ENV.CONDITIONAL || 'false') === 'true';
const MAX_ID = parseInt(__ENV.PRODUCT_MAX_ID || '1000');
const CATEGORIES = [
  'Audio', 'Computing', 'Wearables', 'Photography', 'Stationery', 'Home & Kitchen',
  'Gaming', 'Sports', 'Books', 'Toys',
];

const notModified = new Counter('responses_304');

// الـ thresholds هون بتجبر k6 يحسب أرقام كل endpoint لحاله (والقيم عالية حتى ما يفشل الاختبار)
export const options = {
  vus: parseInt(__ENV.VUS || '30'),
  duration: __ENV.DURATION || '60s',
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{endpoint:products_list}': ['p(99)<60000'],
    'http_req_duration{endpoint:product_show}': ['p(99)<60000'],
    'http_req_duration{endpoint:products_featured}': ['p(99)<60000'],
    'http_req_duration{endpoint:my_orders}': ['p(99)<60000'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({
      email: __ENV.USER_EMAIL || 'perf1@example.com',
      password: __ENV.USER_PASSWORD || 'Password123',
    }),
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
  );
  const ok = check(res, { 'login ok': (r) => r.status === 200 });
  if (!ok) {
    throw new Error(`login failed (${res.status}): شغّل php artisan perf:seed أولاً. ${res.body}`);
  }
  const body = res.json();
  return { token: body.data ? body.data.access_token : body.access_token };
}

// ذاكرة ETag لكل VU (مثل المتصفح)
const etags = {};

function get(url, name, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (CONDITIONAL && etags[url]) headers['If-None-Match'] = etags[url];

  const res = http.get(url, { headers, tags: { endpoint: name } });

  if (res.status === 304) notModified.add(1);
  if (CONDITIONAL && res.status === 200 && res.headers.Etag) etags[url] = res.headers.Etag;

  check(res, { [`${name} 200/304`]: (r) => r.status === 200 || r.status === 304 });
  return res;
}

function rnd(n) {
  return Math.floor(Math.random() * n);
}

export default function (data) {
  const r = Math.random();

  if (r < 0.50) {
    // قائمة منتجات: تصنيف + صفحة (عدد محدود من المفاتيح = المتصفحين بيكرروا نفس الصفحات)
    const cat = encodeURIComponent(CATEGORIES[rnd(CATEGORIES.length)]);
    get(`${BASE}/products?category=${cat}&page=${1 + rnd(5)}&per_page=15`, 'products_list');
  } else if (r < 0.75) {
    get(`${BASE}/products/${1 + rnd(Math.min(MAX_ID, 500))}`, 'product_show');
  } else if (r < 0.85) {
    get(`${BASE}/products/featured?limit=4`, 'products_featured');
  } else {
    get(`${BASE}/orders?per_page=15`, 'my_orders', data.token);
  }

  sleep(0.1);
}

function row(data, name, label) {
  const m = data.metrics[name];
  if (!m) return `${label.padEnd(26)} (no data)`;
  const v = m.values;
  const f = (x) => (x === undefined ? '-' : x.toFixed(1).padStart(8));
  return `${label.padEnd(26)}${f(v.med)}${f(v['p(95)'])}${f(v['p(99)'])}`;
}

export function handleSummary(data) {
  const reqs = data.metrics.http_reqs.values;
  const lines = [
    '',
    `=== ${LABEL} (conditional=${CONDITIONAL}) ===`,
    `${''.padEnd(26)}${'p50 ms'.padStart(8)}${'p95 ms'.padStart(8)}${'p99 ms'.padStart(8)}`,
    row(data, 'http_req_duration', 'ALL'),
    row(data, 'http_req_duration{endpoint:products_list}', 'GET /products'),
    row(data, 'http_req_duration{endpoint:product_show}', 'GET /products/{id}'),
    row(data, 'http_req_duration{endpoint:products_featured}', 'GET /products/featured'),
    row(data, 'http_req_duration{endpoint:my_orders}', 'GET /orders (customer)'),
    '',
    `requests/sec : ${reqs.rate.toFixed(1)}`,
    `total reqs   : ${reqs.count}`,
    `failed       : ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
    `304 responses: ${data.metrics.responses_304 ? data.metrics.responses_304.values.count : 0}`,
    `data received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB`,
    '',
  ];

  return {
    stdout: lines.join('\n'),
    [`/perf/results/${LABEL}.json`]: JSON.stringify(data, null, 2),
  };
}
