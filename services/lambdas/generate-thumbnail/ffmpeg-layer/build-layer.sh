#!/bin/bash
# Build script for FFmpeg Lambda layer
# Downloads FFmpeg static binary and packages it for Lambda layer

set -e

LAYER_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="${LAYER_DIR}/bin"
FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
TEMP_DIR=$(mktemp -d)

echo "=== Building FFmpeg Lambda Layer ==="
echo "Layer directory: ${LAYER_DIR}"
echo "Binary directory: ${BIN_DIR}"

# Clean previous build
rm -rf "${BIN_DIR}"/*

# Download FFmpeg static binary
echo "Downloading FFmpeg static binary..."
cd "${TEMP_DIR}"
curl -L "${FFMPEG_URL}" -o ffmpeg.tar.xz

# Extract FFmpeg binary
echo "Extracting FFmpeg binary..."
tar -xJf ffmpeg.tar.xz
FFMPEG_DIR=$(find . -maxdepth 1 -type d -name "ffmpeg-*-amd64-static" | head -1)

if [ -z "${FFMPEG_DIR}" ]; then
  echo "ERROR: Could not find FFmpeg directory in archive"
  exit 1
fi

# Copy FFmpeg binary to layer bin directory
echo "Copying FFmpeg binary to layer..."
cp "${FFMPEG_DIR}/ffmpeg" "${BIN_DIR}/ffmpeg"
chmod +x "${BIN_DIR}/ffmpeg"

# Verify binary
if [ ! -f "${BIN_DIR}/ffmpeg" ]; then
  echo "ERROR: FFmpeg binary not found after copy"
  exit 1
fi

echo "✓ FFmpeg binary installed at ${BIN_DIR}/ffmpeg"
echo "✓ Layer structure ready for deployment"

# Cleanup
rm -rf "${TEMP_DIR}"

echo "=== Layer build complete ==="

