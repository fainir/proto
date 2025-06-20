#!/bin/bash

# Script to prepare the Ubuntu VM image for bundling in the desktop app
# This script builds the Docker image and exports it as a tar file for bundling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DESKTOP_APP_DIR="$(dirname "$SCRIPT_DIR")"
VM_BUNDLE_DIR="$DESKTOP_APP_DIR/bundled-vm"
CONTAINER_IMAGE_DIR="$VM_BUNDLE_DIR/container-image"

echo "Preparing Ubuntu VM image for desktop app..."
echo "Project directory: $PROJECT_DIR"
echo "Desktop app directory: $DESKTOP_APP_DIR"
echo "VM bundle directory: $VM_BUNDLE_DIR"

# Create necessary directories
mkdir -p "$CONTAINER_IMAGE_DIR"

# Check if Docker or Podman is available
if command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
    echo "Using Docker to build container image"
elif command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    echo "Using Podman to build container image"
else
    echo "Error: Neither Docker nor Podman is available. Please install one of them."
    exit 1
fi

# Build the container image
echo "Building container image..."
cd "$PROJECT_DIR"

IMAGE_TAG="computer-use-demo:desktop"
$CONTAINER_CMD build -t "$IMAGE_TAG" -f Dockerfile .

# Export the image
echo "Exporting container image..."
$CONTAINER_CMD save "$IMAGE_TAG" -o "$CONTAINER_IMAGE_DIR/computer-use-demo.tar"

# Compress the image to save space
echo "Compressing container image..."
cd "$CONTAINER_IMAGE_DIR"
if command -v gzip &> /dev/null; then
    gzip -f computer-use-demo.tar
    mv computer-use-demo.tar.gz computer-use-demo.tar
fi

# Get image size for verification
IMAGE_SIZE=$(du -h computer-use-demo.tar | cut -f1)
echo "Container image prepared: $CONTAINER_IMAGE_DIR/computer-use-demo.tar ($IMAGE_SIZE)"

# Create a manifest file with image information
cat > "$CONTAINER_IMAGE_DIR/image-manifest.json" << EOF
{
  "name": "computer-use-demo",
  "tag": "desktop",
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "size": "$IMAGE_SIZE",
  "file": "computer-use-demo.tar",
  "platform": {
    "os": "linux",
    "architecture": "amd64"
  },
  "description": "Anthropic Computer Use Demo Ubuntu container with desktop environment"
}
EOF

echo "Image manifest created: $CONTAINER_IMAGE_DIR/image-manifest.json"

# Verify the exported image (optional)
if [[ "${VERIFY_IMAGE:-false}" == "true" ]]; then
    echo "Verifying exported image..."
    TEMP_IMAGE_NAME="computer-use-demo-verify:test"
    $CONTAINER_CMD load -i computer-use-demo.tar
    
    # Test run to verify the image works
    echo "Testing container startup..."
    CONTAINER_ID=$($CONTAINER_CMD run -d --name computer-use-demo-test "$TEMP_IMAGE_NAME" /bin/bash -c "sleep 10")
    
    # Wait a moment and check if container is running
    sleep 2
    if $CONTAINER_CMD ps | grep -q "$CONTAINER_ID"; then
        echo "✅ Container image verified successfully"
        $CONTAINER_CMD stop "$CONTAINER_ID" >/dev/null 2>&1
    else
        echo "❌ Container image verification failed"
        exit 1
    fi
    
    # Cleanup
    $CONTAINER_CMD rm "$CONTAINER_ID" >/dev/null 2>&1 || true
    $CONTAINER_CMD rmi "$TEMP_IMAGE_NAME" >/dev/null 2>&1 || true
fi

echo ""
echo "✅ Ubuntu VM image preparation complete!"
echo "   Image location: $CONTAINER_IMAGE_DIR/computer-use-demo.tar"
echo "   Image size: $IMAGE_SIZE"
echo ""
echo "The bundled VM image is ready for packaging in the desktop app installer."

# Optional: Show disk usage summary
echo "Disk usage summary:"
echo "   Container image: $IMAGE_SIZE"
echo "   Bundle directory: $(du -sh "$VM_BUNDLE_DIR" | cut -f1)"
echo ""

# Create a README for the bundled VM
cat > "$VM_BUNDLE_DIR/README.md" << EOF
# Bundled Ubuntu VM

This directory contains the pre-built Ubuntu container image that provides the desktop environment for the Computer Use Demo.

## Contents

- \`container-image/computer-use-demo.tar\` - The Ubuntu container image with desktop environment
- \`container-image/image-manifest.json\` - Image metadata and information
- \`runtime/\` - Podman runtime binaries for different platforms

## Image Details

The container image includes:
- Ubuntu 24.04 base system
- XFCE desktop environment
- VNC server (x11vnc)
- noVNC web interface
- Python environment with Computer Use Demo
- Pre-installed applications (Firefox, LibreOffice, etc.)

## Usage

The desktop application automatically loads and runs this container image using the bundled Podman runtime. No external Docker installation is required.

## Size Optimization

The image has been compressed to minimize the installer size while maintaining all necessary functionality.
EOF

echo "Documentation created: $VM_BUNDLE_DIR/README.md"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' in the desktop-app directory"
echo "2. Run 'npm run build:mac' to create the macOS installer"
echo "3. The installer will include the bundled VM and be fully self-contained" 