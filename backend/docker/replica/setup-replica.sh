#!/bin/bash
# يربط db-replica كنسخة قراءة من db (نسخ MySQL غير متزامن).
# بيشتغل مرة وحدة (خدمة replica-setup بـ compose) وبيعيد التشغيل بأمان.
set -euo pipefail

PRIMARY=db
REPLICA=db-replica
ROOT_PW=root_docker_password
REPL_USER=replicator
REPL_PW=replicator_password
DB_NAME=ecommerce

p() { mysql -h"$PRIMARY" -uroot -p"$ROOT_PW" "$@"; }
r() { mysql -h"$REPLICA" -uroot -p"$ROOT_PW" "$@"; }

echo ">> waiting for both servers"
until p -e "SELECT 1" >/dev/null 2>&1; do sleep 2; done
until r -e "SELECT 1" >/dev/null 2>&1; do sleep 2; done

if r -e "SHOW REPLICA STATUS\G" 2>/dev/null | grep -q "Replica_IO_Running: Yes"; then
    echo ">> replication already running"
    exit 0
fi

echo ">> creating replication user on primary"
p -e "CREATE USER IF NOT EXISTS '$REPL_USER'@'%' IDENTIFIED BY '$REPL_PW';
      GRANT REPLICATION SLAVE ON *.* TO '$REPL_USER'@'%';
      FLUSH PRIVILEGES;"

echo ">> pointing replica at primary"
# لازم قبل الـ dump: تغيير SOURCE_HOST بيصفّر إحداثيات الـ binlog، والـ dump بيحط الإحداثيات الصح بعدها
r -e "STOP REPLICA; RESET REPLICA ALL;
      CHANGE REPLICATION SOURCE TO
        SOURCE_HOST='$PRIMARY', SOURCE_PORT=3306,
        SOURCE_USER='$REPL_USER', SOURCE_PASSWORD='$REPL_PW',
        GET_SOURCE_PUBLIC_KEY=1;"

echo ">> copying current data (consistent snapshot + binlog position)"
mysqldump -h"$PRIMARY" -uroot -p"$ROOT_PW" \
    --single-transaction --source-data=1 --databases "$DB_NAME" | r

echo ">> starting replication"
r -e "START REPLICA;"
sleep 3

r -e "SHOW REPLICA STATUS\G" | grep -E "Replica_IO_Running|Replica_SQL_Running|Seconds_Behind_Source|Last_IO_Error|Last_SQL_Error" || true

if ! r -e "SHOW REPLICA STATUS\G" | grep -q "Replica_SQL_Running: Yes"; then
    echo "!! replication is NOT running, check the errors above"
    exit 1
fi

echo ">> replica is ready"
