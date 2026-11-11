"""Warehouse database connection and schema initialization."""

import os
import time

import pymysql


def connect():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "warehouse-db"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USERNAME", "warehouse_user"),
        password=os.getenv("DB_PASSWORD", "warehouse_password"),
        database=os.getenv("DB_DATABASE", "warehouse"),
        autocommit=False,
        connect_timeout=5,
    )


def init_schema(retries=60):
    for attempt in range(retries):
        try:
            conn = connect()
            break
        except pymysql.err.OperationalError as exc:
            print(f"waiting for database ({attempt + 1}/{retries}): {exc}", flush=True)
            time.sleep(2)
    else:
        raise RuntimeError("database never became ready")

    with conn, conn.cursor() as cur:
        cur.execute(
            """CREATE TABLE IF NOT EXISTS stock (
                 product_id BIGINT NOT NULL PRIMARY KEY,
                 available  INT NOT NULL,
                 CHECK (available >= 0)
               ) ENGINE=InnoDB"""
        )
        cur.execute(
            """CREATE TABLE IF NOT EXISTS reservations (
                 reservation_id VARCHAR(64) NOT NULL,
                 product_id BIGINT NOT NULL,
                 quantity INT NOT NULL,
                 status VARCHAR(10) NOT NULL DEFAULT 'reserved',
                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                 PRIMARY KEY (reservation_id, product_id)
               ) ENGINE=InnoDB"""
        )
        for pair in filter(None, os.getenv("WAREHOUSE_SEED", "").split(",")):
            product_id, qty = pair.split(":")
            cur.execute(
                "INSERT IGNORE INTO stock (product_id, available) VALUES (%s, %s)",
                (int(product_id), int(qty)),
            )
        conn.commit()
