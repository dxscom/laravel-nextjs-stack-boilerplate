#!/bin/bash

# Laravel + Next.js Stack - Development

cd "$(dirname "$0")/.."

# Load .env for BASE_DOMAIN
if [ -f ".env" ]; then
    source .env
fi
BASE_DOMAIN=${BASE_DOMAIN:-$(basename "$(pwd)")}

echo "Starting development..."
echo ""

# Clean up
pkill -f "next dev" 2>/dev/null || true
rm -f frontend/.next/dev/lock
rm -f pnpm-lock.yaml pnpm-workspace.yaml package-lock.json

# Step 1: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "Step 1: Install dependencies"
    pnpm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Step 2: Generate Omnify schemas
echo "Step 2: Generate schemas"
npx omnify generate || echo "⚠️  Schema generation skipped (packages may not be available)"
echo ""

# Step 3: Backend tasks (migrate + sync + swagger)
echo "Step 3: Backend tasks"
cd backend
php artisan migrate --force 2>/dev/null || true
php artisan sso:sync-permissions 2>/dev/null && echo "✓ SSO permissions synced" || echo "⚠️  SSO sync skipped"
php artisan l5-swagger:generate >/dev/null 2>&1 && echo "✓ Swagger docs generated" || echo "⚠️  Swagger generation skipped (no API endpoints yet)"
cd ..
echo ""

# Step 4: Start frontend dev server
echo "Step 4: Start frontend"
echo ""
echo "============================================================"
echo "Dev Tools (shared):"
echo "  phpMyAdmin: https://pma.omnify.test"
echo "  Mailpit:    https://mail.omnify.test"
echo "  Minio:      https://minio.omnify.test"
echo ""
echo "Application:"
echo "  API:        https://api.$BASE_DOMAIN.test"
echo "  API Docs:   https://api.$BASE_DOMAIN.test/api/documentation"
echo "  Frontend:   https://$BASE_DOMAIN.test"
echo "============================================================"
echo ""
cd frontend && pnpm dev
