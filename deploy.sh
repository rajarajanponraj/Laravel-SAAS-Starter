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
PHP_BIN=""
echo "==> Detecting server PHP binaries..."

SEARCH_PATHS=(
    "/usr/bin/php-8.4"
    "/usr/bin/php8.4"
    "/usr/bin/php84"
    "/usr/local/bin/php-8.4"
    "/usr/local/bin/php8.4"
    "/opt/php-8.4/bin/php"
    "/opt/php/8.4/bin/php"
    "/opt/alt/php84/usr/bin/php"
    "/opt/cpanel/ea-php84/root/usr/bin/php"
    "/usr/bin/php-8.3"
    "/usr/bin/php8.3"
    "/usr/bin/php-8.2"
    "/usr/bin/php8.2"
    "/usr/bin/php"
    "php"
)

# Expand any php binaries in common directories
for p in /usr/bin/php* /usr/local/bin/php* /opt/*/bin/php* /opt/*/*/bin/php*; do
    if [ -x "$p" ]; then
        SEARCH_PATHS+=("$p")
    fi
done

# Select the highest available PHP version (preferring >= 8.4)
BEST_VER=0
for candidate in "${SEARCH_PATHS[@]}"; do
    if [[ "$candidate" =~ (cgi|phpize|config|dbg|fpm) ]]; then
        continue
    fi
    if command -v "$candidate" >/dev/null 2>&1 || [ -x "$candidate" ]; then
        RAW_VER=$($candidate -r "echo PHP_VERSION_ID;" 2>/dev/null || echo 0)
        VER_ID=$(echo "$RAW_VER" | grep -oE '^[0-9]+' || echo 0)
        VER_STR=$($candidate -r "echo PHP_VERSION;" 2>/dev/null || echo "")
        if [ "$VER_ID" -ge 80200 ]; then
            echo "   Found PHP CLI: $candidate (version $VER_STR)"
            if [ "$VER_ID" -gt "$BEST_VER" ]; then
                BEST_VER=$VER_ID
                PHP_BIN="$candidate"
            fi
        fi
    fi
done

if [ -z "$PHP_BIN" ]; then
    echo "WARNING: Could not find PHP >= 8.2 CLI binary. Defaulting to 'php'." >&2
    PHP_BIN="php"
fi

echo "==> Selected PHP binary: $PHP_BIN ($($PHP_BIN -v 2>&1 | head -n 1))"

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

# 2b. Ensure StackCP database credentials, APP_URL, and APP_KEY are configured in .env
if [ -f ".env" ]; then
    # Always enforce the subdomain URL
    sed -i "s|^APP_URL=.*|APP_URL=https://crm.bytebunkers.sbs|" .env

    # Always ensure APP_KEY is generated and populated
    if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
        echo "==> APP_KEY missing or not base64 in .env! Generating production app key..."
        $PHP_BIN artisan key:generate --force || true
    fi

    if grep -q "your_stackcp_database_name" .env 2>/dev/null || grep -q "DB_HOST=127.0.0.1" .env 2>/dev/null || grep -q "DB_HOST=localhost" .env 2>/dev/null; then
        echo "==> Configuring StackCP database credentials in .env..."
        sed -i "s|^DB_HOST=.*|DB_HOST=shareddb-m.hosting.stackcp.net|" .env
        sed -i "s|^DB_DATABASE=.*|DB_DATABASE=wfa-crm-3130313f75|" .env
        sed -i "s|^DB_USERNAME=.*|DB_USERNAME=wfa-crm-3130313f75|" .env
        sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD="rtbepa-cet5rC-zmyxtg"|' .env
    fi

    # Configure StackCP SMTP mail credentials in .env
    if grep -q "your_email_password" .env 2>/dev/null || ! grep -q "^MAIL_PASSWORD=" .env 2>/dev/null || grep -q 'MAIL_PASSWORD=""' .env 2>/dev/null; then
        echo "==> Configuring StackCP SMTP mail credentials in .env..."
        sed -i "s|^MAIL_MAILER=.*|MAIL_MAILER=smtp|" .env
        sed -i "s|^MAIL_HOST=.*|MAIL_HOST=mail.bytebunkers.sbs|" .env
        sed -i "s|^MAIL_PORT=.*|MAIL_PORT=587|" .env
        sed -i "s|^MAIL_USERNAME=.*|MAIL_USERNAME=notifications@bytebunkers.sbs|" .env
        sed -i 's|^MAIL_PASSWORD=.*|MAIL_PASSWORD="zWkjmd-yac6eh-cdchcu"|' .env
        sed -i "s|^MAIL_ENCRYPTION=.*|MAIL_ENCRYPTION=tls|" .env
        sed -i 's|^MAIL_FROM_ADDRESS=.*|MAIL_FROM_ADDRESS="notifications@bytebunkers.sbs"|' .env
        sed -i 's|^MAIL_FROM_NAME=.*|MAIL_FROM_NAME="CrewFlow"|' .env
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
mkdir -p storage/app/public storage/app/backups storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache || true

# 6. Ensure storage symlink exists
echo "==> Linking storage..."
$PHP_BIN artisan storage:link || true

# 6b. Bridge web server document roots for crm.bytebunkers.sbs
echo "==> Configuring web server document roots for crm.bytebunkers.sbs..."
CURRENT_DIR="$(pwd)"
PARENT_DIR="$(cd .. && pwd)"
TARGET_PUBLIC="$CURRENT_DIR/public"

echo "Current dir: $CURRENT_DIR"
echo "Parent dir:  $PARENT_DIR"
echo "Listing parent dir ($PARENT_DIR):"
ls -la "$PARENT_DIR" || true

if [ -d "$PARENT_DIR/public_html" ]; then
    echo "Listing public_html ($PARENT_DIR/public_html):"
    ls -la "$PARENT_DIR/public_html" || true
fi

# Deploy check diagnostic file
echo "crewflow-deployed-ok-$(date +%s)" > "$TARGET_PUBLIC/deploy_check.txt"

# Bridge all possible subdomain paths that StackCP creates
for SUBDIR in "$PARENT_DIR/public_html/crm" "$PARENT_DIR/crm" "$PARENT_DIR/public_html/crm.bytebunkers.sbs" "$PARENT_DIR/crm.bytebunkers.sbs" "$PARENT_DIR/subdomains/crm"; do
    PARENT_OF_SUBDIR="$(dirname "$SUBDIR")"
    if [ -d "$PARENT_OF_SUBDIR" ]; then
        echo "--> Inspecting candidate subdomain document root: $SUBDIR"
        if [ -L "$SUBDIR" ]; then
            echo "    Existing symlink found at $SUBDIR -> $(readlink "$SUBDIR")"
            rm -f "$SUBDIR"
        elif [ -d "$SUBDIR" ]; then
            echo "    Existing directory found at $SUBDIR"
            # Remove directory if empty or replace
            rm -rf "$SUBDIR"
        fi
        echo "    Creating symlink: $SUBDIR -> $TARGET_PUBLIC"
        ln -s "$TARGET_PUBLIC" "$SUBDIR" || true
    fi
done

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

# 8b. Check and report SMTP server status
echo "==> Checking SMTP mail transport status..."
$PHP_BIN artisan mail:check || true

# 9. Restart queue workers so they pick up new code
echo "==> Restarting background queue workers..."
$PHP_BIN artisan queue:restart || true

# 10. Bring application back online
echo "==> Bringing application back online..."
$PHP_BIN artisan up

if [ -f "storage/logs/laravel.log" ]; then
    echo "==> Recent Laravel logs:"
    tail -n 30 storage/logs/laravel.log || true
fi

echo "==> [CrewFlow] Deployment completed successfully on $(date '+%Y-%m-%d %H:%M:%S')!"
