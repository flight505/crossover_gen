#!/bin/bash

echo "🧪 Testing Crossover Gen Build..."
echo "================================"

# Clean cache
echo "Cleaning cache..."
rm -rf .next

# Build test
echo "Running production build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Lint test  
echo "Running linter..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Lint passed"
else
    echo "❌ Lint failed"
    exit 1
fi

echo "================================"
echo "✅ All tests passed!"