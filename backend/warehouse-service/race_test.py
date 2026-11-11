"""
إثبات الـ Race Condition:  عدة طلبات بنفس اللحظة على آخر قطعة، ينجح واحد بس.
شغّله:  python race_test.py
"""
import os
import sys
import threading
import uuid

import grpc

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "generated"))
import warehouse_pb2 as pb  # noqa: E402
import warehouse_pb2_grpc as pb_grpc  # noqa: E402

import db  # noqa: E402

TARGET = os.getenv("WAREHOUSE_ADDR", "localhost:50051")
PRODUCT_ID = 999
CLIENTS = 20

# جهّز منتج تجريبي بقطعة وحدة
conn = db.connect()
with conn, conn.cursor() as cur:
    cur.execute("DELETE FROM reservations WHERE product_id = %s", (PRODUCT_ID,))
    cur.execute(
        "INSERT INTO stock (product_id, available) VALUES (%s, 1) ON DUPLICATE KEY UPDATE available = 1",
        (PRODUCT_ID,),
    )
    conn.commit()

results, barrier = [], threading.Barrier(CLIENTS)


def attempt():
    channel = grpc.insecure_channel(TARGET)
    stub = pb_grpc.WarehouseStub(channel)
    barrier.wait()  # كلهم ينطلقوا بنفس اللحظة
    response = stub.ReserveStock(
        pb.ReserveStockRequest(reservation_id=str(uuid.uuid4()), items=[pb.StockItem(product_id=PRODUCT_ID, quantity=1)]),
        timeout=10,
    )
    results.append(response.reserved)


threads = [threading.Thread(target=attempt) for _ in range(CLIENTS)]
[t.start() for t in threads]
[t.join() for t in threads]

succeeded = sum(results)
print(f"{CLIENTS} simultaneous requests on the last item -> {succeeded} succeeded, {CLIENTS - succeeded} rejected")

stub = pb_grpc.WarehouseStub(grpc.insecure_channel(TARGET))
print("stock left:", stub.GetStock(pb.GetStockRequest(product_id=PRODUCT_ID)).available)
sys.exit(0 if succeeded == 1 else 1)