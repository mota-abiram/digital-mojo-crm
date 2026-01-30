#!/bin/bash

# 🔥 Firebase Emulator - Java Installation Script
# This script installs Java (required for Firebase Emulators) on macOS

echo "☕ Installing Java for Firebase Emulators..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "📦 Installing OpenJDK (Java Development Kit)..."
brew install openjdk@17

echo ""
echo "🔗 Linking Java to system path..."
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

echo ""
echo "✅ Java installation complete!"
echo ""
echo "To verify installation, run:"
echo "  java -version"
echo ""
echo "Then you can start Firebase Emulators with:"
echo "  npm run emulators"
