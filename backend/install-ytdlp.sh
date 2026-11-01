#!/bin/bash
# Install yt-dlp on Render

echo "Installing yt-dlp..."

# Try to install via pip (Python package manager)
if command -v pip3 &> /dev/null; then
    pip3 install --user yt-dlp
    echo "yt-dlp installed via pip3"
elif command -v pip &> /dev/null; then
    pip install --user yt-dlp
    echo "yt-dlp installed via pip"
else
    # Fallback: download yt-dlp binary
    echo "pip not found, downloading yt-dlp binary..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp
    chmod a+rx /tmp/yt-dlp
    mkdir -p $HOME/.local/bin
    mv /tmp/yt-dlp $HOME/.local/bin/
    export PATH="$HOME/.local/bin:$PATH"
    echo "yt-dlp binary installed"
fi

# Also install ffmpeg if not present (needed for audio conversion)
if ! command -v ffmpeg &> /dev/null; then
    echo "Warning: ffmpeg not found. yt-dlp may not be able to convert audio formats."
fi

echo "yt-dlp installation complete"
yt-dlp --version || echo "Warning: yt-dlp not accessible in PATH"
