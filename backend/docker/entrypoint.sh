#!/bin/sh
set -e

cd /var/www/html

# Generate .env if it does not exist
if [ ! -f .env ]; then
    echo ">> No .env found, generating one"

    cat > .env <<EOF
APP_NAME=ECommerce
APP_ENV=${APP_ENV:-local}
APP_KEY=
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost:9000}

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-ecommerce}
DB_USERNAME=${DB_USERNAME:-ecommerce_user}
DB_PASSWORD=${DB_PASSWORD:-ecommerce_password}

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

LOG_CHANNEL=stack
LOG_LEVEL=debug

WAREHOUSE_GRPC_HOST=${WAREHOUSE_GRPC_HOST:-warehouse:50051}

JWT_SECRET=
JWT_TTL=${JWT_TTL:-15}
EOF
fi

# Generate APP_KEY if missing or empty
if ! grep -q '^APP_KEY=base64:.' .env; then
    echo ">> Generating APP_KEY"
    php artisan key:generate --force
fi

# Generate JWT_SECRET if missing or empty
if ! grep -q '^JWT_SECRET=.' .env; then
    echo ">> Generating JWT_SECRET"
    php artisan jwt:secret --force
fi

# Create Laravel storage directories
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Create storage symbolic link
if [ ! -L public/storage ]; then
    php artisan storage:link --force
fi

# Run database setup only on the application container.
if [ "${RUN_DATABASE_SETUP:-true}" = "true" ]; then
    php artisan migrate --force

    # Seed: admin account, demo customers, and sample products (idempotent)
    php artisan db:seed --force
fi

# Start the application
exec "$@"