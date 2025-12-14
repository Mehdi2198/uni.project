#!/bin/bash

# University Quiz App - All-in-One Startup Script
# Usage: ./run.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting University Quiz App ===${NC}"

# Function to kill all background processes on exit
cleanup() {
    echo -e "\n${RED}Shutting down all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# Load NVM if available (to fix legacy node v12 issues)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
# Attempt to use the latest version
nvm use default 2>/dev/null || nvm use node 2>/dev/null || echo "Using system node: $(node -v)"

# ----------------------------------------------------------------
# 1. Backend Setup & Run
# ----------------------------------------------------------------
echo -e "\n${GREEN}[1/4] Starting Backend...${NC}"
cd backend

# Check/Create venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies if needed (simple check)
if [ ! -f "venv/installed" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# Run Migrations
echo "Running database migrations..."
alembic upgrade head

# Start FastAPI
echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# ----------------------------------------------------------------
# 2. Telegram Bot
# ----------------------------------------------------------------
echo -e "\n${GREEN}[2/4] Starting Telegram Bot...${NC}"
python run_bot.py &
BOT_PID=$!

cd ..

# ----------------------------------------------------------------
# 3. Admin Dashboard
# ----------------------------------------------------------------
echo -e "\n${GREEN}[3/4] Starting Admin Dashboard...${NC}"
cd frontend/admin-dashboard

if [ ! -d "node_modules" ]; then
    echo "Installing Admin Dashboard dependencies..."
    npm install
fi

echo "Starting Admin Dashboard..."
npm run dev -- --host &
ADMIN_PID=$!

cd ../..

# ----------------------------------------------------------------
# 4. Mini App
# ----------------------------------------------------------------
echo -e "\n${GREEN}[4/4] Starting Mini App...${NC}"
cd frontend/mini-app

if [ ! -d "node_modules" ]; then
    echo "Installing Mini App dependencies..."
    npm install
fi

echo "Starting Mini App..."
npm run dev -- --host &
MINIAPP_PID=$!

cd ../..

# ----------------------------------------------------------------
# Summary
# ----------------------------------------------------------------
echo -e "\n${BLUE}=== All Services Started ===${NC}"
echo -e "🚀 Backend API:    ${GREEN}http://localhost:8001${NC}"
echo -e "📄 API Docs:       ${GREEN}http://localhost:8001/api/docs${NC}"
echo -e "💻 Admin Panel:    ${GREEN}http://localhost:3000${NC}"
echo -e "📱 Mini App:       ${GREEN}http://localhost:5173${NC}"
echo -e "🤖 Telegram Bot:   ${GREEN}Running in background${NC}"
echo -e "\nPres Ctrl+C to stop all services."

# Wait for all background processes
wait
