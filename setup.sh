#!/bin/bash

echo "🚀 Setting up Arcium Private Lending Protocol..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please update with your configuration."
fi

# Build the project
echo "🔨 Building the project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run start:dev"
echo ""
echo "To view API documentation:"
echo "  http://localhost:3000/api"
echo ""
echo "To run tests:"
echo "  npm run test"
