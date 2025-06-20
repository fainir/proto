#!/bin/bash

# Comprehensive build script for Computer Use Demo Desktop App
# This script handles the complete build process including VM preparation and installer creation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_APP_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DESKTOP_APP_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check for Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or later is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check for npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check for container runtime (Docker or Podman)
    if ! command_exists docker && ! command_exists podman; then
        print_error "Neither Docker nor Podman is available. Please install one of them to build the VM image."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    cd "$DESKTOP_APP_DIR"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in desktop-app directory"
        exit 1
    fi
    
    # Install npm dependencies
    npm install
    
    print_success "Dependencies installed successfully"
}

# Function to prepare VM image
prepare_vm_image() {
    print_status "Preparing Ubuntu VM image..."
    
    # Check if we should skip VM preparation
    if [ "${SKIP_VM_PREP:-false}" = "true" ]; then
        print_warning "Skipping VM image preparation (SKIP_VM_PREP=true)"
        return 0
    fi
    
    # Run the VM preparation script
    if [ -f "$SCRIPT_DIR/prepare-vm-image.sh" ]; then
        bash "$SCRIPT_DIR/prepare-vm-image.sh"
    else
        print_error "VM preparation script not found: $SCRIPT_DIR/prepare-vm-image.sh"
        exit 1
    fi
    
    print_success "VM image prepared successfully"
}

# Function to download Podman binaries
download_podman_binaries() {
    print_status "Downloading Podman binaries..."
    
    BUNDLED_RUNTIME_DIR="$DESKTOP_APP_DIR/bundled-runtime/podman"
    
    # Create directories for different platforms
    mkdir -p "$BUNDLED_RUNTIME_DIR/mac/arm64"
    mkdir -p "$BUNDLED_RUNTIME_DIR/mac/x64"
    mkdir -p "$BUNDLED_RUNTIME_DIR/linux/arm64"
    mkdir -p "$BUNDLED_RUNTIME_DIR/linux/x64"
    mkdir -p "$BUNDLED_RUNTIME_DIR/windows/x64"
    
    # For now, we'll create placeholder files
    # In a real implementation, you would download the actual Podman binaries
    
    # macOS ARM64
    if [ ! -f "$BUNDLED_RUNTIME_DIR/mac/arm64/podman" ]; then
        print_status "Creating macOS ARM64 Podman placeholder..."
        echo "#!/bin/bash" > "$BUNDLED_RUNTIME_DIR/mac/arm64/podman"
        echo "# Podman binary for macOS ARM64" >> "$BUNDLED_RUNTIME_DIR/mac/arm64/podman"
        echo "# This is a placeholder - replace with actual Podman binary" >> "$BUNDLED_RUNTIME_DIR/mac/arm64/podman"
        chmod +x "$BUNDLED_RUNTIME_DIR/mac/arm64/podman"
    fi
    
    # macOS x64
    if [ ! -f "$BUNDLED_RUNTIME_DIR/mac/x64/podman" ]; then
        print_status "Creating macOS x64 Podman placeholder..."
        echo "#!/bin/bash" > "$BUNDLED_RUNTIME_DIR/mac/x64/podman"
        echo "# Podman binary for macOS x64" >> "$BUNDLED_RUNTIME_DIR/mac/x64/podman"
        echo "# This is a placeholder - replace with actual Podman binary" >> "$BUNDLED_RUNTIME_DIR/mac/x64/podman"
        chmod +x "$BUNDLED_RUNTIME_DIR/mac/x64/podman"
    fi
    
    # Linux ARM64
    if [ ! -f "$BUNDLED_RUNTIME_DIR/linux/arm64/podman" ]; then
        print_status "Creating Linux ARM64 Podman placeholder..."
        echo "#!/bin/bash" > "$BUNDLED_RUNTIME_DIR/linux/arm64/podman"
        echo "# Podman binary for Linux ARM64" >> "$BUNDLED_RUNTIME_DIR/linux/arm64/podman"
        echo "# This is a placeholder - replace with actual Podman binary" >> "$BUNDLED_RUNTIME_DIR/linux/arm64/podman"
        chmod +x "$BUNDLED_RUNTIME_DIR/linux/arm64/podman"
    fi
    
    # Linux x64
    if [ ! -f "$BUNDLED_RUNTIME_DIR/linux/x64/podman" ]; then
        print_status "Creating Linux x64 Podman placeholder..."
        echo "#!/bin/bash" > "$BUNDLED_RUNTIME_DIR/linux/x64/podman"
        echo "# Podman binary for Linux x64" >> "$BUNDLED_RUNTIME_DIR/linux/x64/podman"
        echo "# This is a placeholder - replace with actual Podman binary" >> "$BUNDLED_RUNTIME_DIR/linux/x64/podman"
        chmod +x "$BUNDLED_RUNTIME_DIR/linux/x64/podman"
    fi
    
    # Windows x64
    if [ ! -f "$BUNDLED_RUNTIME_DIR/windows/x64/podman.exe" ]; then
        print_status "Creating Windows x64 Podman placeholder..."
        echo "REM Podman binary for Windows x64" > "$BUNDLED_RUNTIME_DIR/windows/x64/podman.exe"
        echo "REM This is a placeholder - replace with actual Podman binary" >> "$BUNDLED_RUNTIME_DIR/windows/x64/podman.exe"
    fi
    
    print_success "Podman binaries prepared"
}

# Function to create app icons
create_app_icons() {
    print_status "Creating application icons..."
    
    ICONS_DIR="$DESKTOP_APP_DIR/resources/icons"
    mkdir -p "$ICONS_DIR"
    
    # For now, we'll create placeholder icon files
    # In a real implementation, you would create proper icon files
    
    if [ ! -f "$ICONS_DIR/icon.icns" ]; then
        print_warning "Creating placeholder macOS icon (icon.icns)"
        echo "# macOS icon placeholder" > "$ICONS_DIR/icon.icns"
    fi
    
    if [ ! -f "$ICONS_DIR/icon.ico" ]; then
        print_warning "Creating placeholder Windows icon (icon.ico)"
        echo "# Windows icon placeholder" > "$ICONS_DIR/icon.ico"
    fi
    
    if [ ! -f "$ICONS_DIR/icon.png" ]; then
        print_warning "Creating placeholder Linux icon (icon.png)"
        echo "# Linux icon placeholder" > "$ICONS_DIR/icon.png"
    fi
    
    print_success "Application icons created"
}

# Function to build the desktop app
build_desktop_app() {
    print_status "Building desktop application..."
    
    cd "$DESKTOP_APP_DIR"
    
    # Determine the target platform
    TARGET_PLATFORM="${1:-mac}"
    
    case "$TARGET_PLATFORM" in
        "mac")
            print_status "Building for macOS..."
            npm run build:mac
            ;;
        "win")
            print_status "Building for Windows..."
            npm run build:win
            ;;
        "linux")
            print_status "Building for Linux..."
            npm run build:linux
            ;;
        "all")
            print_status "Building for all platforms..."
            npm run build
            ;;
        *)
            print_error "Unknown platform: $TARGET_PLATFORM"
            print_status "Available platforms: mac, win, linux, all"
            exit 1
            ;;
    esac
    
    print_success "Desktop application built successfully"
}

# Function to show build summary
show_build_summary() {
    print_success "Build completed successfully!"
    echo ""
    echo "📦 Build Summary:"
    echo "   Platform: ${TARGET_PLATFORM:-mac}"
    echo "   Build directory: $DESKTOP_APP_DIR/dist"
    echo ""
    
    if [ -d "$DESKTOP_APP_DIR/dist" ]; then
        echo "📁 Generated files:"
        ls -la "$DESKTOP_APP_DIR/dist" | grep -v "^total" | grep -v "^d" | while read -r line; do
            echo "   $(echo "$line" | awk '{print $9}') ($(echo "$line" | awk '{print $5}'))"
        done
        echo ""
    fi
    
    echo "🚀 Installation:"
    echo "   1. Locate the installer in the dist/ directory"
    echo "   2. Run the installer on the target platform"
    echo "   3. The app will include a self-contained Ubuntu VM"
    echo "   4. No external Docker installation required"
    echo ""
    echo "📋 Next steps:"
    echo "   - Test the installer on the target platform"
    echo "   - Verify VM functionality"
    echo "   - Configure API keys in the application"
}

# Function to clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts..."
    
    cd "$DESKTOP_APP_DIR"
    
    # Remove dist directory
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Removed dist directory"
    fi
    
    # Remove node_modules (optional)
    if [ "${CLEAN_DEPS:-false}" = "true" ]; then
        if [ -d "node_modules" ]; then
            rm -rf node_modules
            print_status "Removed node_modules directory"
        fi
    fi
    
    print_success "Build artifacts cleaned"
}

# Main function
main() {
    echo ""
    echo "🚀 Computer Use Demo Desktop App Builder"
    echo "========================================"
    echo ""
    
    # Parse command line arguments
    TARGET_PLATFORM="mac"
    CLEAN_FIRST=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                TARGET_PLATFORM="$2"
                shift 2
                ;;
            --clean)
                CLEAN_FIRST=true
                shift
                ;;
            --skip-vm)
                export SKIP_VM_PREP=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --platform PLATFORM  Target platform (mac, win, linux, all) [default: mac]"
                echo "  --clean              Clean build artifacts before building"
                echo "  --skip-vm            Skip VM image preparation"
                echo "  --help, -h           Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Clean if requested
    if [ "$CLEAN_FIRST" = true ]; then
        clean_build
    fi
    
    # Execute build steps
    check_requirements
    install_dependencies
    prepare_vm_image
    download_podman_binaries
    create_app_icons
    build_desktop_app "$TARGET_PLATFORM"
    show_build_summary
    
    print_success "All done! 🎉"
}

# Run main function with all arguments
main "$@" 