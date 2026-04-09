#!/bin/bash

# ShiftGuard Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
API_DOMAIN=""
DB_PASSWORD=""
SECRET_KEY=""
JWT_SECRET=""
INSTALL_DIR="/var/www/shiftguard"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ShiftGuard Production Deployment    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should NOT be run as root${NC}"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

# Collect configuration
echo -e "${YELLOW}📝 Configuration${NC}"
read -p "Enter your domain (e.g., shiftguard.co.il): " DOMAIN
read -p "Enter your API domain (e.g., api.shiftguard.co.il): " API_DOMAIN
read -sp "Enter database password: " DB_PASSWORD
echo ""
read -sp "Enter secret key (or press Enter to generate): " SECRET_KEY
echo ""
read -sp "Enter JWT secret key (or press Enter to generate): " JWT_SECRET
echo ""

# Generate secrets if not provided
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    echo -e "${GREEN}✓ Generated secret key${NC}"
fi

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}✓ Generated JWT secret key${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"

# Update system
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    ufw \
    fail2ban

echo -e "${GREEN}✓ System dependencies installed${NC}"

# Install Node.js
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
echo -e "${GREEN}✓ Node.js installed${NC}"

# Setup PostgreSQL
echo -e "${YELLOW}🗄️  Setting up PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE DATABASE shiftguard_prod;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER shiftguard WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE shiftguard_prod TO shiftguard;"
echo -e "${GREEN}✓ PostgreSQL configured${NC}"

# Create installation directory
echo -e "${YELLOW}📁 Creating installation directory...${NC}"
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR
echo -e "${GREEN}✓ Directory created${NC}"

# Setup Backend
echo -e "${YELLOW}🔧 Setting up backend...${NC}"
cd $INSTALL_DIR

# Copy backend files (assuming they're in current directory)
if [ -d "backend" ]; then
    echo "Backend files found"
else
    echo -e "${RED}❌ Backend files not found. Please ensure backend/ directory exists${NC}"
    exit 1
fi

cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Create .env.production
cat > .env.production << EOF
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://shiftguard:$DB_PASSWORD@localhost/shiftguard_prod
JWT_SECRET_KEY=$JWT_SECRET
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
FRONTEND_URL=https://$DOMAIN
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
WEBAUTHN_RP_ID=$DOMAIN
WEBAUTHN_RP_NAME=ShiftGuard
WEBAUTHN_RP_ORIGIN=https://$DOMAIN
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax
EOF

# Run migrations
python migrations/add_webauthn_table.py

echo -e "${GREEN}✓ Backend configured${NC}"

# Setup Frontend
echo -e "${YELLOW}🎨 Setting up frontend...${NC}"
cd $INSTALL_DIR/frontend

# Create .env.production
cat > .env.production << EOF
VITE_API_URL=https://$API_DOMAIN
VITE_APP_NAME=ShiftGuard
VITE_APP_VERSION=1.0.0
VITE_WEBAUTHN_RP_ID=$DOMAIN
VITE_WEBAUTHN_RP_NAME=ShiftGuard
VITE_ENABLE_BIOMETRIC_AUTH=true
EOF

# Install dependencies and build
npm install
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"

# Setup Gunicorn service
echo -e "${YELLOW}⚙️  Setting up Gunicorn service...${NC}"
sudo mkdir -p /var/log/shiftguard
sudo chown www-data:www-data /var/log/shiftguard

sudo tee /etc/systemd/system/shiftguard.service > /dev/null << EOF
[Unit]
Description=ShiftGuard Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin"
Environment="FLASK_ENV=production"
ExecStart=$INSTALL_DIR/backend/venv/bin/gunicorn \\
    --workers 4 \\
    --bind 127.0.0.1:5000 \\
    --timeout 120 \\
    --access-logfile /var/log/shiftguard/access.log \\
    --error-logfile /var/log/shiftguard/error.log \\
    run:app

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable shiftguard
sudo systemctl start shiftguard

echo -e "${GREEN}✓ Gunicorn service started${NC}"

# Setup Nginx
echo -e "${YELLOW}🌐 Setting up Nginx...${NC}"
sudo tee /etc/nginx/sites-available/shiftguard > /dev/null << 'EOF'
# Backend API
server {
    listen 80;
    server_name API_DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name API_DOMAIN_PLACEHOLDER;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}

# Frontend
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    return 301 https://DOMAIN_PLACEHOLDER$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.DOMAIN_PLACEHOLDER;
    return 301 https://DOMAIN_PLACEHOLDER$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;
    
    root INSTALL_DIR_PLACEHOLDER/frontend/dist;
    index index.html;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Replace placeholders
sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/shiftguard
sudo sed -i "s/API_DOMAIN_PLACEHOLDER/$API_DOMAIN/g" /etc/nginx/sites-available/shiftguard
sudo sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" /etc/nginx/sites-available/shiftguard

# Enable site
sudo ln -sf /etc/nginx/sites-available/shiftguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Setup SSL with Let's Encrypt
echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
echo "This will request SSL certificates from Let's Encrypt"
echo "Make sure your DNS records are pointing to this server!"
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    echo -e "${GREEN}✓ SSL certificates installed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping SSL setup. Run manually: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN${NC}"
fi

# Setup Firewall
echo -e "${YELLOW}🔥 Setting up firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configured${NC}"

# Setup Fail2Ban
echo -e "${YELLOW}🛡️  Setting up Fail2Ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo -e "${GREEN}✓ Fail2Ban configured${NC}"

# Final checks
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment Complete! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  Domain: https://$DOMAIN"
echo "  API: https://$API_DOMAIN"
echo "  Installation: $INSTALL_DIR"
echo ""
echo -e "${YELLOW}🔍 Next Steps:${NC}"
echo "  1. Visit https://$DOMAIN to access the application"
echo "  2. Login with your credentials"
echo "  3. Go to Settings → Profile"
echo "  4. Enable biometric authentication"
echo ""
echo -e "${YELLOW}📊 Useful Commands:${NC}"
echo "  Check backend status: sudo systemctl status shiftguard"
echo "  View backend logs: sudo tail -f /var/log/shiftguard/error.log"
echo "  View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  Restart backend: sudo systemctl restart shiftguard"
echo "  Restart nginx: sudo systemctl restart nginx"
echo ""
echo -e "${GREEN}✨ Enjoy your secure biometric authentication! ✨${NC}"
