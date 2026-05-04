#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
# (The healthcheck in docker-compose handles this usually, but a small delay helps)
sleep 2

# Push database schema
echo "Pushing database schema..."
npx prisma@6.19.3 db push --accept-data-loss

# Start the application
echo "Starting application..."
node server.js
