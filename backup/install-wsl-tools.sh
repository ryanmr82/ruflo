#!/bin/bash
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing Claude Code..."
sudo npm install -g @anthropic-ai/claude-code

echo "Installing claude-flow..."
sudo npm install -g claude-flow@latest

echo "Verifying installations..."
node --version
npm --version
npx claude-flow@latest --version

echo "Setup complete! You can now use claude-flow"