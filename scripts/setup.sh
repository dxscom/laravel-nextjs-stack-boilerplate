#!/bin/bash

# Laravel + Next.js Stack Setup

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load .env if exists
if [ -f ".env" ]; then
    source .env
fi

# Set defaults
BASE_DOMAIN=${BASE_DOMAIN:-$(basename "$(pwd)")}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-}
# SSO Console URL (default: dev.console.omnify.jp, use auth-omnify.test for local)
SSO_CONSOLE_URL=${SSO_CONSOLE_URL:-https://dev.console.omnify.jp}

# DB prefix (sanitize: only allow alphanumeric and underscore)
DB_PREFIX=$(echo "$BASE_DOMAIN" | tr '-' '_' | sed 's/[^a-zA-Z0-9_]//g')
if [ -z "$DB_PREFIX" ]; then
    echo "Error: Invalid BASE_DOMAIN - contains no valid characters"
    exit 1
fi

echo "Stack: Laravel + Next.js"
echo "Domain: $BASE_DOMAIN"
echo "Frontend Port: $FRONTEND_PORT"
echo "SSO Console: $SSO_CONSOLE_URL"
echo ""

# ============================================================
# Step 1: Install Homebrew (if not installed)
# ============================================================
echo "Step 1: Check Homebrew"
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f "/usr/local/bin/brew" ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    echo "✓ Homebrew installed"
else
    echo "✓ Homebrew already installed"
    if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f "/usr/local/bin/brew" ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

# ============================================================
# Step 2: Install Herd (if not installed)
# ============================================================
echo ""
echo "Step 2: Check Herd"
HERD_NEWLY_INSTALLED=false

if [ ! -d "/Applications/Herd.app" ] && ! command -v herd &> /dev/null; then
    echo "Installing Herd..."
    brew install --cask herd
    HERD_NEWLY_INSTALLED=true
    echo "✓ Herd installed"
else
    echo "✓ Herd already installed"
fi

if ! command -v herd &> /dev/null; then
    export PATH="$HOME/Library/Application Support/Herd/bin:$PATH"
fi

if [ "$HERD_NEWLY_INSTALLED" = true ]; then
    if ! pgrep -x "Herd" > /dev/null; then
        echo ""
        echo "Starting Herd app..."
        open -a "Herd" 2>/dev/null || true
        echo "⚠️  Please complete Herd initial setup, then run this script again."
        exit 0
    fi
fi

# Check Laravel installer
if ! command -v laravel &> /dev/null; then
    echo "Installing Laravel installer..."
    composer global require laravel/installer --no-interaction
    echo "✓ Laravel installer installed"
else
    echo "✓ Laravel installer already installed"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node
    echo "✓ Node.js installed"
else
    echo "✓ Node.js already installed"
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
    echo "✓ pnpm installed"
else
    echo "✓ pnpm already installed"
fi

# ============================================================
# Step 3: Install services (MySQL, Redis, Mailpit, Minio)
# ============================================================
echo ""
echo "Step 3: Check services"

# Helper: check if brew service is running
is_service_running() {
    brew services list 2>/dev/null | grep -q "^$1.*started"
}

# MySQL
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL..."
    brew install mysql
    brew services start mysql
    sleep 1
elif ! is_service_running mysql; then
    brew services start mysql >/dev/null 2>&1
    sleep 1
fi
if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root -p${MYSQL_ROOT_PASSWORD}"
else
    MYSQL_CMD="mysql -u root"
fi
echo "✓ MySQL (port 3306)"

# Redis
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    brew install redis
    brew services start redis
elif ! is_service_running redis; then
    brew services start redis >/dev/null 2>&1
fi
echo "✓ Redis (port 6379)"

# Mailpit
if ! command -v mailpit &> /dev/null; then
    echo "Installing Mailpit..."
    brew install mailpit
    brew services start mailpit
elif ! is_service_running mailpit; then
    brew services start mailpit >/dev/null 2>&1
fi
herd proxy mail.omnify http://localhost:8025 --secure >/dev/null 2>&1 || true
echo "✓ Mailpit (https://mail.omnify.test)"

# Minio
if ! command -v minio &> /dev/null; then
    echo "Installing Minio..."
    brew install minio/stable/minio
fi
if ! command -v mc &> /dev/null; then
    echo "Installing Minio Client..."
    brew install minio/stable/mc
fi
mkdir -p "$HOME/.local/share/minio/data"
if ! pgrep -x "minio" > /dev/null; then
    MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin minio server "$HOME/.local/share/minio/data" --console-address ":9001" &>/dev/null &
    sleep 2
fi
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin >/dev/null 2>&1 || true
herd proxy minio.omnify http://localhost:9001 --secure >/dev/null 2>&1 || true
echo "✓ Minio (https://minio.omnify.test)"

# phpMyAdmin
PMA_DIR="$HOME/.local/share/phpmyadmin"
if [ ! -d "$PMA_DIR" ]; then
    echo "Installing phpMyAdmin..."
    mkdir -p "$HOME/.local/share"
    cd "$HOME/.local/share"
    curl -sL https://www.phpmyadmin.net/downloads/phpMyAdmin-latest-all-languages.tar.gz | tar xz
    mv phpMyAdmin-*-all-languages phpmyadmin
    cd "$PROJECT_ROOT"
fi
# Only create config if not exists (preserve user customizations)
if [ ! -f "$PMA_DIR/config.inc.php" ]; then
    cat > "$PMA_DIR/config.inc.php" << PMAEOF
<?php
\$cfg['blowfish_secret'] = 'omnify-local-dev-secret-key-32ch';
\$cfg['Servers'][1]['auth_type'] = 'config';
\$cfg['Servers'][1]['host'] = '127.0.0.1';
\$cfg['Servers'][1]['user'] = 'root';
\$cfg['Servers'][1]['password'] = '${MYSQL_ROOT_PASSWORD}';
\$cfg['Servers'][1]['AllowNoPassword'] = true;
\$cfg['UploadDir'] = '';
\$cfg['SaveDir'] = '';
\$cfg['TempDir'] = '/tmp';
PMAEOF
fi
cd "$PMA_DIR"
herd link pma.omnify >/dev/null 2>&1 || true
herd secure pma.omnify >/dev/null 2>&1 || true
cd "$PROJECT_ROOT"
echo "✓ phpMyAdmin (https://pma.omnify.test)"

# ============================================================
# Step 4: Setup Local SSO Console (if using local console)
# ============================================================
echo ""
echo "Step 4: Setup SSO Console"

# Check if using local console (*.test domain)
if [[ "$SSO_CONSOLE_URL" == *".test"* ]]; then
    # Extract console path from Herd links
    CONSOLE_NAME=$(echo "$SSO_CONSOLE_URL" | sed 's|https://||; s|\.test.*||')
    CONSOLE_PATH=$(herd links 2>/dev/null | grep -E "^\| $CONSOLE_NAME\s" | awk -F'|' '{print $5}' | xargs)
    
    if [ -n "$CONSOLE_PATH" ] && [ -d "$CONSOLE_PATH" ]; then
        echo "Found local console at: $CONSOLE_PATH"
        
        # Ensure storage/keys directory exists
        mkdir -p "$CONSOLE_PATH/storage/keys"
        
        # Check if JWT keys need to be generated
        KEYS_JSON="$CONSOLE_PATH/storage/keys/keys.json"
        NEED_KEY_FIX=false
        
        if [ ! -f "$KEYS_JSON" ]; then
            NEED_KEY_FIX=true
        else
            # Check if keys.json has valid paths
            if grep -q "/Herd/" "$KEYS_JSON" 2>/dev/null; then
                NEED_KEY_FIX=true
            fi
            # Check if referenced key files exist
            PRIVATE_KEY=$(grep -o '"private_key_path"[^,]*' "$KEYS_JSON" 2>/dev/null | head -1 | cut -d'"' -f4)
            if [ -n "$PRIVATE_KEY" ] && [ ! -f "$PRIVATE_KEY" ]; then
                NEED_KEY_FIX=true
            fi
        fi
        
        if [ "$NEED_KEY_FIX" = true ]; then
            echo "Generating JWT keys for console..."
            
            # Generate new key pair
            KEY_ID="key-$(date +%Y-%m-%d-%H%M%S)-$(openssl rand -hex 3)"
            KEY_DIR="$CONSOLE_PATH/storage/keys/$KEY_ID"
            mkdir -p "$KEY_DIR"
            
            # Generate RSA key pair
            openssl genrsa -out "$KEY_DIR/private.pem" 2048 2>/dev/null
            openssl rsa -in "$KEY_DIR/private.pem" -pubout -out "$KEY_DIR/public.pem" 2>/dev/null
            chmod 600 "$KEY_DIR/private.pem"
            
            # Create metadata
            CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")
            EXPIRES_AT=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S+00:00" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S+00:00")
            cat > "$KEY_DIR/metadata.json" << METAEOF
{
    "key_id": "$KEY_ID",
    "created_at": "$CREATED_AT",
    "expires_at": "$EXPIRES_AT"
}
METAEOF
            
            # Create/update keys.json
            cat > "$KEYS_JSON" << KEYSEOF
{
    "updated_at": "$CREATED_AT",
    "keys": {
        "$KEY_ID": {
            "key_id": "$KEY_ID",
            "status": "active",
            "created_at": "$CREATED_AT",
            "expires_at": "$EXPIRES_AT",
            "public_key_path": "$KEY_DIR/public.pem",
            "private_key_path": "$KEY_DIR/private.pem"
        }
    }
}
KEYSEOF
            echo "✓ JWT keys generated"
        else
            echo "✓ JWT keys already configured"
        fi
        
        # Run console database seeder if needed
        if [ -f "$CONSOLE_PATH/artisan" ]; then
            cd "$CONSOLE_PATH"
            php artisan db:seed --class=DatabaseSeeder --force >/dev/null 2>&1 || true
            cd "$PROJECT_ROOT"
            echo "✓ Console database seeded"
        fi
    else
        echo "⚠️  Local console not found. Make sure to set up the console project first."
        echo "   Expected: herd link $CONSOLE_NAME pointing to console project"
    fi
else
    echo "✓ Using remote console: $SSO_CONSOLE_URL"
fi

# ============================================================
# Step 5: Create directories
# ============================================================
echo ""
echo "Step 5: Create directories"

mkdir -p .omnify/schemas
echo "✓ .omnify/schemas"

# ============================================================
# Step 6: Install dependencies
# ============================================================
echo ""
echo "Step 6: Install dependencies"
if [ -f "package.json" ]; then
    # Check if @famgia packages have newer versions
    FAMGIA_UPDATED=false
    FAMGIA_PACKAGES=$(node -e "const p=require('./package.json'); const deps={...p.dependencies,...p.devDependencies}; console.log(Object.keys(deps).filter(k=>k.startsWith('@famgia/')).join(' '))" 2>/dev/null || true)
    
    if [ -n "$FAMGIA_PACKAGES" ] && [ -d "node_modules" ]; then
        for pkg in $FAMGIA_PACKAGES; do
            INSTALLED=$(node -e "try{console.log(require('$pkg/package.json').version)}catch{console.log('')}" 2>/dev/null || true)
            LATEST=$(pnpm view "$pkg" version 2>/dev/null || true)
            if [ -n "$LATEST" ] && [ -n "$INSTALLED" ] && [ "$INSTALLED" != "$LATEST" ]; then
                echo "📦 $pkg: $INSTALLED → $LATEST"
                FAMGIA_UPDATED=true
            fi
        done
    fi
    
    # Install/update dependencies
    if [ ! -d "node_modules" ]; then
        pnpm install
        echo "✓ dependencies installed"
    elif [ "$FAMGIA_UPDATED" = true ]; then
        echo "Updating @famgia packages..."
        pnpm store prune >/dev/null 2>&1 || true
        pnpm update $FAMGIA_PACKAGES
        echo "✓ @famgia packages updated"
    elif [ "package.json" -nt "node_modules" ]; then
        pnpm install
        echo "✓ dependencies updated"
    else
        echo "✓ dependencies already up to date"
    fi
    
    # Build scripts are auto-approved via pnpm.onlyBuiltDependencies in package.json
else
    echo "✓ No package.json"
fi

# ============================================================
# Step 7: Create Laravel backend
# ============================================================
echo ""
echo "Step 7: Create backend"
BACKEND_EXISTS=false
if [ -d "backend" ]; then
    BACKEND_EXISTS=true
    echo "✓ backend already exists"
else
    laravel new backend --no-interaction
    cd backend
    
    # Install API with Sanctum
    php artisan install:api --no-interaction
    
    # Install SSO Client package
    echo "Installing SSO Client..."
    composer config --no-plugins allow-plugins.omnifyjp/omnify-client-laravel-sso true
    composer require omnifyjp/omnify-client-laravel-sso lcobucci/jwt --no-interaction
    
    # Install L5 Swagger
    echo "Installing L5 Swagger..."
    composer require darkaonline/l5-swagger --no-interaction
    php artisan vendor:publish --provider="L5Swagger\L5SwaggerServiceProvider" --force
    
    cd "$PROJECT_ROOT"
fi

cd backend

# ============================================================
# Step 8: Setup backend environment
# ============================================================
echo ""
echo "Step 8: Setup environment"

# Create .env from template if not exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    # Replace placeholders with actual values
    sed -e "s/\${BASE_DOMAIN}/$BASE_DOMAIN/g" \
        -e "s/\${DB_PREFIX}/$DB_PREFIX/g" \
        .env.example > .env
    echo "✓ Created .env from template"
fi

php artisan key:generate --force
# Only publish config if not exists (preserve user customizations)
if [ ! -f "config/sso-client.php" ]; then
    php artisan vendor:publish --tag=sso-client-config 2>/dev/null || true
fi

# Create MySQL database
if $MYSQL_CMD -e "SELECT 1" >/dev/null 2>&1; then
    $MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS ${DB_PREFIX}_db;" 2>/dev/null || true
    echo "✓ MySQL database: ${DB_PREFIX}_db"
else
    echo "⚠️  MySQL: Cannot connect (check MYSQL_ROOT_PASSWORD in .env)"
fi

# Create Minio bucket
if command -v mc &> /dev/null; then
    mc alias set local http://127.0.0.1:9000 minioadmin minioadmin 2>/dev/null || true
    mc mb local/${DB_PREFIX} 2>/dev/null || true
    echo "✓ Minio bucket: ${DB_PREFIX}"
fi

echo "✓ Environment configured"

# Link backend to Herd
herd link api.$BASE_DOMAIN
herd secure api.$BASE_DOMAIN
echo "✓ https://api.$BASE_DOMAIN.test"

# ============================================================
# Step 9: Create Next.js frontend
# ============================================================
echo ""
echo "Step 9: Create frontend"
cd "$PROJECT_ROOT"
FRONTEND_EXISTS=false
if [ -d "frontend" ]; then
    FRONTEND_EXISTS=true
    echo "✓ frontend already exists"
else
    npx --yes create-next-app@latest frontend \
        --typescript \
        --tailwind \
        --eslint \
        --app \
        --src-dir \
        --import-alias "@/*" \
        --turbopack \
        --use-pnpm \
        --yes
    
    # Install React packages
    cd frontend
    pnpm add @famgia/omnify-react @famgia/omnify-client-sso-react @famgia/omnify-react-sso \
        @ant-design/icons @ant-design/nextjs-registry antd \
        @tanstack/react-query axios dayjs next-intl zod
    cd "$PROJECT_ROOT"
fi

echo "✓ frontend"

# Proxy frontend to port 3000
herd proxy $BASE_DOMAIN http://localhost:3000 --secure
echo "✓ https://$BASE_DOMAIN.test → localhost:3000"

echo ""
echo "============================================================"
echo "Done!"
echo "============================================================"
echo ""
echo "Dev Tools:"
echo "  phpMyAdmin: https://pma.omnify.test"
echo "  Mailpit:    https://mail.omnify.test"
echo "  Minio:      https://minio.omnify.test"
echo ""
echo "Application:"
echo "  API:        https://api.$BASE_DOMAIN.test"
echo "  Frontend:   https://$BASE_DOMAIN.test"
echo ""
echo "Start development:"
echo "  npm run dev"
