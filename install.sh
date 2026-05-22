#!/usr/bin/env bash

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
  ________ .____     __________ ________   
 /  _____/ |    |    \______   \\_____  \  
/   \  ___ |    |     |       _/ /   |   \ 
\    \_\  \|    |___  |    |   \/    |    \
 \______  /|_______ \ |____|_  /\_______  /
        \/         \/        \/         \/ 
 G E U L T A R A E R O  -  Auto-pilot Agentic Orchestrator
EOF
echo -e "${NC}"

echo -e "${GREEN}[*] Welcome to 글타래로 (Geultaraero) Installation!${NC}"

# 의존성 검사
if ! command -v git &> /dev/null; then
    echo -e "${RED}[!] 'git' is not installed. Please install git first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[!] 'npm' is not installed. Please install Node.js first.${NC}"
    exit 1
fi

INSTALL_DIR="$HOME/.geultaraero"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}[*] Existing installation found at $INSTALL_DIR. Updating repository...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "${GREEN}[*] Cloning repository to $INSTALL_DIR...${NC}"
    git clone https://github.com/WizMasia/Geultaraero.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}[*] Installing npm dependencies...${NC}"
npm install

echo -e "${GREEN}[*] Linking 'glro' to global commands...${NC}"
npm link

echo ""
echo -e "${GREEN}=========================================================================${NC}"
echo -e "${YELLOW}🎉 Installation Completed Successfully! 🎉${NC}"
echo -e "${GREEN}=========================================================================${NC}"
echo ""
echo -e "You can now run the system from ANY directory by simply typing:"
echo -e "${BLUE}  $ glro${NC}"
echo ""
echo -e "Or, if you are using AI IDEs (Antigravity, Cursor, Windsurf, etc.),"
echo -e "Just open the ${BLUE}$INSTALL_DIR${NC} directory in your IDE and tell it to start!"
echo ""
