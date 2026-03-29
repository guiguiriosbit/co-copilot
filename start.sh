#!/bin/bash
echo "Starting Commercial Copilot..."

# Function to kill processes on exit
cleanup() {
    echo "Stopping services..."
    # Kill by PID first
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    # Also kill by port to get any orphaned nodemon children
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Cleanup any stale processes on our ports
echo "Checking for stale processes on ports 3001 and 5173..."
lsof -ti :3001,5173 | xargs kill -9 2>/dev/null
sleep 1  # wait for ports to fully release

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
echo "Waiting for services to be ready..."
echo "---------------------------------------------------"

# Wait for backend
MAX_RETRIES=30
COUNT=0
while ! lsof -i :3001 > /dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Backend failed to start on port 3001"
        exit 1
    fi
done
echo "✅ Backend is UP"

# Wait for frontend
COUNT=0
while ! lsof -i :5173 > /dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Frontend failed to start on port 5173"
        exit 1
    fi
done
echo "✅ Frontend is UP"

echo "---------------------------------------------------"
echo "Application started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "---------------------------------------------------"
echo "To seed the database with sample data, run (in a new terminal):"
echo "cd backend && node seed.js"
echo "---------------------------------------------------"
echo "Press CTRL+C to stop both services."
echo "---------------------------------------------------"

wait
