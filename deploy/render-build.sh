#!/bin/bash

# Render pre-deploy script
# Runs before Daphne starts

cd /app/thoughtflow

echo "🔄 Running database migrations..."
python manage.py migrate --noinput

echo "✅ Migrations complete!"
