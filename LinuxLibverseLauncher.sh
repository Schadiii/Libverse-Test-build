#!/usr/bin/env bash

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Libverse Environment..."

# Trap CTRL+C (SIGINT) to kill both background processes when you close the script
trap 'echo "Stopping servers..."; kill 0' EXIT

# Start Backend Server
echo "Starting Backend on port 8000..."
(cd "$SCRIPT_DIR/Backend" && python LibverseServer.py) &

# Start Frontend Server
echo "Starting Frontend on port 5173..."
(cd "$SCRIPT_DIR/Frontend" && npm run dev) &

# Keep script running to show logs
wait
