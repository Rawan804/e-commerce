"""تحديد كمية منتج بالمستودع:  python set_stock.py <product_id> <quantity>

الدالة set_stock() بيستعملها كمان admin_http.py (واجهة الأدمن)، فالمنطق بمكان واحد.
"""
import sys

import db


def set_stock(product_id: int, quantity: int) -> None:
    if product_id <= 0:
        raise ValueError("product_id must be positive")
    if quantity < 0:
        raise ValueError("quantity must be >= 0")

    conn = db.connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO stock (product_id, available) VALUES (%s, %s) "
                "ON DUPLICATE KEY UPDATE available = VALUES(available)",
                (product_id, quantity),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python set_stock.py <product_id> <quantity>")
    try:
        set_stock(int(sys.argv[1]), int(sys.argv[2]))
    except ValueError as exc:
        sys.exit(str(exc))
    print(f"product {sys.argv[1]}: available = {sys.argv[2]}")
