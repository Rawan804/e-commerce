"""واجهة HTTP داخلية صغيرة لتحديد المخزون (فوق نفس منطق set_stock.py).

- ما بتنفتح للخارج: المنفذ 8090 مش منشور بالـ compose، بس Laravel (داخل شبكة Docker) بيوصلها.
- Laravel هو اللي بيتحقق إنو المستخدم أدمن؛ هون بس مفتاح مشترك (X-Admin-Key) كطبقة تانية.
- إذا WAREHOUSE_ADMIN_KEY مش محدد، الواجهة ما بتشتغل أصلاً.
"""
import hmac
import json
import os
import re
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from set_stock import set_stock

PORT = int(os.getenv("WAREHOUSE_ADMIN_PORT", "8090"))
MAX_QUANTITY = 100_000
MAX_BODY_BYTES = 1024
STOCK_PATH = re.compile(r"/stock/(\d+)")


class Handler(BaseHTTPRequestHandler):
    server_version = "warehouse-admin"

    def _send(self, status: int, body: dict) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _authorized(self) -> bool:
        expected = os.getenv("WAREHOUSE_ADMIN_KEY", "").encode()
        given = self.headers.get("X-Admin-Key", "").encode()
        return bool(expected) and hmac.compare_digest(given, expected)

    def do_PUT(self) -> None:  # PUT /stock/<product_id>  body: {"quantity": 25}
        if not self._authorized():
            return self._send(403, {"error": "forbidden"})

        match = STOCK_PATH.fullmatch(self.path)
        if not match:
            return self._send(404, {"error": "not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_BODY_BYTES:
                raise ValueError
            quantity = json.loads(self.rfile.read(length)).get("quantity")
            if isinstance(quantity, bool) or not isinstance(quantity, int) or not 0 <= quantity <= MAX_QUANTITY:
                raise ValueError
        except (ValueError, AttributeError):
            return self._send(422, {"error": f"quantity must be an integer between 0 and {MAX_QUANTITY}"})

        product_id = int(match.group(1))
        try:
            set_stock(product_id, quantity)
        except Exception:
            traceback.print_exc()
            return self._send(500, {"error": "could not update stock"})

        self._send(200, {"product_id": product_id, "available": quantity})

    def log_message(self, fmt, *args) -> None:  # بدون ضجيج
        pass


def start_in_background() -> None:
    if not os.getenv("WAREHOUSE_ADMIN_KEY"):
        print("admin http disabled (WAREHOUSE_ADMIN_KEY is not set)", flush=True)
        return
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print(f"warehouse admin http listening on :{PORT}", flush=True)
