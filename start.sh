#!/bin/bash
echo "Starting Commercial Copilot..."

# Function to kill processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Cleanup any stale processes on our ports
echo "Checking for stale processes on ports 3001 and 5173..."
lsof -ti :3001,5173 | xargs kill -9 2>/dev/null

# Install and start backend
echo "---------------------------------------------------"
echo "Setting up Backend..."
echo "---------------------------------------------------"
cd backend
    echo "Installing backend dependencies..."
    npm install
    echo "Starting Backend Server..."
npm start &
BACKEND_PID=$!

# Install and start frontend
echo "---------------------------------------------------"
echo "Setting up Frontend..."
echo "---------------------------------------------------"
cd ../frontend
    echo "Installing frontend dependencies..."
    npm install
    echo "Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo "---------------------------------------------------"
echo "Application started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "---------------------------------------------------"
echo "To seed the database with sample data, run (in a new terminal):"
echo "cd backend && node seed.js"
echo "---------------------------------------------------"
echo "Press CTRL+C to stop both services."
echo "---------------------------------------------------"

wait
