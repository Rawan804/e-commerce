"""خدمة المستودع: gRPC + قاعدة بيانات خاصة. اللغة: Python."""
import os
import sys
from concurrent import futures

import grpc
import pymysql

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))
import warehouse_pb2 as pb  # noqa: E402
import warehouse_pb2_grpc as pb_grpc  # noqa: E402

import db  # noqa: E402
import admin_http  # noqa: E402

DEADLOCK_RETRIES = 3


class WarehouseService(pb_grpc.WarehouseServicer):
    # ---------------------------------------------------------- GetStock
    def GetStock(self, request, context):
        conn = db.connect()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT available FROM stock WHERE product_id = %s", (request.product_id,))
                row = cur.fetchone()
        finally:
            conn.close()

        if row is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"product {request.product_id} is not stocked")
        return pb.GetStockResponse(product_id=request.product_id, available=row[0])

    # ------------------------------------------------------- ReserveStock
    def ReserveStock(self, request, context):
        if not request.reservation_id or not request.items:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "reservation_id and items are required")

        wanted = {}
        for item in request.items:
            if item.quantity <= 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "quantity must be positive")
            wanted[item.product_id] = wanted.get(item.product_id, 0) + item.quantity

        for attempt in range(DEADLOCK_RETRIES):
            try:
                return self._reserve_once(request.reservation_id, wanted)
            except pymysql.err.OperationalError as exc:
                if exc.args and exc.args[0] == 1213 and attempt < DEADLOCK_RETRIES - 1:
                    continue  # deadlock: جرّب من جديد
                raise

    def _reserve_once(self, reservation_id, wanted):
        conn = db.connect()
        try:
            with conn.cursor() as cur:
                # نفس الطلب انبعت مرتين (إعادة محاولة)؟ ما منحجز مرتين
                cur.execute("SELECT status FROM reservations WHERE reservation_id = %s", (reservation_id,))
                existing = [r[0] for r in cur.fetchall()]
                if existing:
                    conn.rollback()
                    return pb.ReserveStockResponse(reserved=all(s == "reserved" for s in existing))

                # كل المنتجات بعملية وحدة (transaction): كلها أو لا شيء.
                # الترتيب ثابت (حسب رقم المنتج) حتى ما يصير deadlock بين طلبين.
                failed = False
                for product_id in sorted(wanted):
                    # الشرط "available >= qty" داخل نفس الجملة هو اللي بيمنع الـ Race Condition:
                    # القاعدة بتقفل الصف، فطلبين على آخر قطعة ما بينجحوا الاثنين.
                    cur.execute(
                        "UPDATE stock SET available = available - %s WHERE product_id = %s AND available >= %s",
                        (wanted[product_id], product_id, wanted[product_id]),
                    )
                    if cur.rowcount == 0:
                        failed = True
                        break

                if failed:
                    conn.rollback()
                    return pb.ReserveStockResponse(reserved=False, shortages=self._shortages(wanted))

                cur.executemany(
                    "INSERT INTO reservations (reservation_id, product_id, quantity) VALUES (%s, %s, %s)",
                    [(reservation_id, p, q) for p, q in wanted.items()],
                )
                conn.commit()
                return pb.ReserveStockResponse(reserved=True)
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def _shortages(wanted):
        conn = db.connect()
        try:
            with conn.cursor() as cur:
                result = []
                for product_id in sorted(wanted):
                    cur.execute("SELECT available FROM stock WHERE product_id = %s", (product_id,))
                    row = cur.fetchone()
                    available = row[0] if row else 0
                    if available < wanted[product_id]:
                        result.append(pb.StockShortage(product_id=product_id, requested=wanted[product_id], available=available))
                return result
        finally:
            conn.close()

    # ------------------------------------------------------- ReleaseStock
    def ReleaseStock(self, request, context):
        if not request.reservation_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "reservation_id is required")

        conn = db.connect()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM reservations WHERE reservation_id = %s LIMIT 1", (request.reservation_id,))
                exists = cur.fetchone() is not None

                cur.execute(
                    "SELECT product_id, quantity FROM reservations "
                    "WHERE reservation_id = %s AND status = 'reserved' ORDER BY product_id FOR UPDATE",
                    (request.reservation_id,),
                )
                for product_id, quantity in cur.fetchall():
                    cur.execute("UPDATE stock SET available = available + %s WHERE product_id = %s", (quantity, product_id))
                cur.execute(
                    "UPDATE reservations SET status = 'released' WHERE reservation_id = %s AND status = 'reserved'",
                    (request.reservation_id,),
                )
                conn.commit()
            # لو انعادت المناداة: ما بيصير شي زيادة (idempotent)
            return pb.ReleaseStockResponse(released=exists)
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def serve():
    db.init_schema()
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=int(os.getenv("GRPC_WORKERS", "32"))))
    pb_grpc.add_WarehouseServicer_to_server(WarehouseService(), server)
    port = os.getenv("GRPC_PORT", "50051")
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"warehouse service listening on :{port}", flush=True)
    admin_http.start_in_background()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()