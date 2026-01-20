#!/bin/bash

# Laravel + Next.js Stack - Development

cd "$(dirname "$0")/.."

# Load .env for BASE_DOMAIN and SSO config
if [ -f ".env" ]; then
    source .env
fi
BASE_DOMAIN=${BASE_DOMAIN:-$(basename "$(pwd)")}
SSO_CONSOLE_URL=${SSO_CONSOLE_URL:-https://dev.console.omnify.jp}
SSO_SERVICE_SLUG=${SSO_SERVICE_SLUG:-test-service}
SSO_SERVICE_SECRET=${SSO_SERVICE_SECRET:-local_dev_secret}

echo "Starting development..."
echo ""

# Clean up
pkill -f "next dev" 2>/dev/null || true
rm -f frontend/.next/dev/lock
rm -f pnpm-lock.yaml pnpm-workspace.yaml package-lock.json

# Sync environment variables
echo "Step 1: Sync environment"

# Update backend .env
if [ -f "backend/.env" ]; then
    sed -i '' "s|^SSO_CONSOLE_URL=.*|SSO_CONSOLE_URL=$SSO_CONSOLE_URL|" backend/.env
    sed -i '' "s|^SSO_SERVICE_SLUG=.*|SSO_SERVICE_SLUG=$SSO_SERVICE_SLUG|" backend/.env
    sed -i '' "s|^SSO_SERVICE_SECRET=.*|SSO_SERVICE_SECRET=$SSO_SERVICE_SECRET|" backend/.env
    sed -i '' "s|^APP_URL=.*|APP_URL=https://api.$BASE_DOMAIN.test|" backend/.env
    echo "✓ backend/.env synced"
fi

# Update frontend .env.local
if [ -f "frontend/.env.local" ]; then
    sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.$BASE_DOMAIN.test|" frontend/.env.local
    sed -i '' "s|^NEXT_PUBLIC_SSO_CONSOLE_URL=.*|NEXT_PUBLIC_SSO_CONSOLE_URL=$SSO_CONSOLE_URL|" frontend/.env.local
    sed -i '' "s|^NEXT_PUBLIC_SSO_SERVICE_SLUG=.*|NEXT_PUBLIC_SSO_SERVICE_SLUG=$SSO_SERVICE_SLUG|" frontend/.env.local
    echo "✓ frontend/.env.local synced"
fi
echo ""

# Step 2: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "Step 2: Install dependencies"
    pnpm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Step 3: Generate Omnify schemas
echo "Step 3: Generate schemas"
npx omnify generate || echo "⚠️  Schema generation skipped (packages may not be available)"
echo ""

# Step 4: Backend tasks (migrate + sync + swagger)
echo "Step 4: Backend tasks"
cd backend
php artisan migrate --force 2>/dev/null || true
php artisan sso:sync-permissions 2>/dev/null && echo "✓ SSO permissions synced" || echo "⚠️  SSO sync skipped"
php artisan l5-swagger:generate >/dev/null 2>&1 && echo "✓ Swagger docs generated" || echo "⚠️  Swagger generation skipped (no API endpoints yet)"
cd ..
echo ""

# Step 5: Start frontend dev server
echo "Step 5: Start frontend"
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
