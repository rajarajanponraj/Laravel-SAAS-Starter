#!/usr/bin/env bash

# ==============================================================================
# CrewFlow - Failproof Server Deployment Script (StackCP / Shared Hosting)
# ==============================================================================
# This script executes on the production server after new code has been deployed
# via GitHub Actions or manual transfer.
# ==============================================================================

set -eo pipefail

echo "==> [CrewFlow] Starting deployment on $(date '+%Y-%m-%d %H:%M:%S')..."

# 1. Determine PHP CLI binary
PHP_BIN="php"
for candidate in php8.4 /usr/bin/php8.4 /usr/local/bin/php8.4 /opt/alt/php84/usr/bin/php /opt/cpanel/ea-php84/root/usr/bin/php /usr/local/bin/ea-php84 /usr/local/bin/php /usr/bin/php php; do
    if command -v "$candidate" >/dev/null 2>&1; then
        PHP_BIN="$candidate"
        break
    fi
done

echo "==> Using PHP binary: $($PHP_BIN -v 2>&1 | head -n 1)"

# 2. Verify or create .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        echo "==> No .env file found. Auto-creating .env from .env.production.example..."
        cp .env.production.example .env
        $PHP_BIN artisan key:generate --force || true
    else
        echo "ERROR: Production .env file is missing in $(pwd)!" >&2
        exit 1
    fi
fi

# 3. Trap errors to ensure maintenance mode is restored if a step fails
cleanup() {
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "==> [ALERT] Deployment encountered an error (exit code $EXIT_CODE)!" >&2
        echo "==> Bringing application back online to prevent permanent downtime..."
        $PHP_BIN artisan up || true
    fi
    exit $EXIT_CODE
}
trap cleanup EXIT

# 4. Put application in maintenance mode (with 60-second retry header)
echo "==> Activating maintenance mode..."
$PHP_BIN artisan down --retry=60 --refresh=15 || true

# 5. Fix permissions for storage and cache directories
echo "==> Setting directory permissions..."
chmod -R 775 storage bootstrap/cache || true

# 6. Ensure storage symlink exists
echo "==> Linking storage..."
$PHP_BIN artisan storage:link || true

# 7. Run failproof database deployment (automated backup + migrations + first-deploy seed check)
echo "==> Executing database deployment (backup, migration, seeding)..."
$PHP_BIN artisan db:deploy --seed-if-empty

# 8. Clear and rebuild production optimization caches
echo "==> Clearing and caching application configurations..."
$PHP_BIN artisan optimize:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache

# 9. Restart queue workers so they pick up new code
echo "==> Restarting background queue workers..."
$PHP_BIN artisan queue:restart || true

# 10. Bring application back online
echo "==> Bringing application back online..."
$PHP_BIN artisan up

echo "==> [CrewFlow] Deployment completed successfully on $(date '+%Y-%m-%d %H:%M:%S')!"
