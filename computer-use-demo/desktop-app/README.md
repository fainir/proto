# Computer Use Demo - Desktop Application

A cross-platform desktop application that provides a self-contained environment for running the Anthropic Computer Use Demo. The application includes a bundled Ubuntu VM with no external Docker installation required.

## Features

- 🖥️ **Self-Contained**: No need to install Docker separately
- 🐧 **Bundled Ubuntu VM**: Pre-configured Ubuntu 24.04 environment with desktop
- 🌐 **Multiple Access Methods**: VNC, noVNC web interface, and Streamlit
- 🔄 **Easy VM Management**: Start, stop, and restart VM with one click
- ⚙️ **Simple Configuration**: Built-in settings for API keys and display options
- 📊 **Real-time Monitoring**: VM status, resource usage, and logs
- 🎨 **Modern UI**: Clean, dark-themed interface with responsive design

## System Requirements

### macOS
- macOS 10.15 (Catalina) or later
- 64-bit Intel or Apple Silicon processor
- 8GB RAM recommended (4GB minimum)
- 10GB free disk space

### Windows
- Windows 10 version 1909 or later
- 64-bit processor
- 8GB RAM recommended (4GB minimum)
- 10GB free disk space

### Linux
- Ubuntu 18.04+ / CentOS 8+ / Fedora 32+ or equivalent
- 64-bit processor
- 8GB RAM recommended (4GB minimum)
- 10GB free disk space

## Quick Start

### Download and Install

1. Download the installer for your platform from the releases page
2. Run the installer and follow the installation prompts
3. Launch "Computer Use Demo" from your applications

### First Run

1. **Configure API Key**: Enter your Anthropic API key when prompted
2. **Start VM**: Click "Start VM" to launch the Ubuntu environment
3. **Access Interface**: Use the quick access buttons to open:
   - **Streamlit Interface**: Web-based chat interface
   - **VNC Desktop**: Full Ubuntu desktop environment
   - **Combined Interface**: Integrated view with both chat and desktop

### Basic Usage

1. **Start the VM**: Click the "Start VM" button in the sidebar
2. **Wait for startup**: The VM status indicator will show "Starting..." then "Running"
3. **Open interface**: Click on any of the quick access buttons to open the desired interface
4. **Configure Claude**: In the Streamlit interface, ensure your API key is properly configured
5. **Start using**: You can now interact with Claude and see it control the desktop environment

## Building from Source

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Docker or Podman (for building the VM image)

### Build Process

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd computer-use-demo
   ```

2. **Run the build script**:
   ```bash
   # Build for macOS (default)
   ./desktop-app/scripts/build-desktop-app.sh

   # Build for specific platform
   ./desktop-app/scripts/build-desktop-app.sh --platform mac
   ./desktop-app/scripts/build-desktop-app.sh --platform win
   ./desktop-app/scripts/build-desktop-app.sh --platform linux

   # Build for all platforms
   ./desktop-app/scripts/build-desktop-app.sh --platform all
   ```

3. **Find the installer**:
   The built installer will be in `desktop-app/dist/`

### Build Options

```bash
# Show help
./desktop-app/scripts/build-desktop-app.sh --help

# Clean build (remove previous artifacts)
./desktop-app/scripts/build-desktop-app.sh --clean

# Skip VM image preparation (for faster rebuilds)
./desktop-app/scripts/build-desktop-app.sh --skip-vm
```

### Manual Build Steps

If you prefer to build manually:

1. **Install dependencies**:
   ```bash
   cd desktop-app
   npm install
   ```

2. **Prepare VM image**:
   ```bash
   ./scripts/prepare-vm-image.sh
   ```

3. **Build the app**:
   ```bash
   npm run build:mac    # For macOS
   npm run build:win    # For Windows
   npm run build:linux  # For Linux
   ```

## Application Architecture

### Components

- **Main Process** (`src/main.js`): Electron main process handling app lifecycle
- **Renderer Process** (`src/renderer/`): UI and user interactions
- **VM Manager** (`src/services/vm-manager.js`): Manages the Ubuntu VM lifecycle
- **Container Service** (`src/services/container-service.js`): Handles container operations
- **Bundled VM** (`bundled-vm/`): Pre-built Ubuntu container image
- **Bundled Runtime** (`bundled-runtime/`): Podman binaries for different platforms

### VM Technology

The application uses **Podman** instead of Docker for several advantages:
- **Rootless operation**: More secure by default
- **No daemon required**: Simpler architecture
- **Docker compatibility**: Uses the same container images
- **Cross-platform**: Works on macOS, Windows, and Linux

### Security

- **Sandboxed environment**: The Ubuntu VM runs in an isolated container
- **No host access**: The VM cannot access the host file system by default
- **Secure API storage**: API keys are stored in the system keychain/credential store
- **Network isolation**: The VM only exposes specific ports for the interfaces

## Usage Guide

### VM Management

#### Starting the VM
1. Click the "Start VM" button in the sidebar
2. Wait for the status indicator to show "Running" (usually 10-30 seconds)
3. The quick access buttons will become enabled

#### Stopping the VM
1. Click the "Stop VM" button
2. Wait for graceful shutdown (up to 30 seconds)
3. The status indicator will show "Stopped"

#### Restarting the VM
1. Click the "Restart VM" button
2. The VM will stop and start automatically
3. Useful for applying configuration changes

### Interface Options

#### Streamlit Interface (Port 8501)
- **Purpose**: Chat-based interaction with Claude
- **Features**: 
  - Send messages to Claude
  - View Claude's responses and actions
  - Configure settings and API keys
- **Best for**: Text-based interactions and monitoring

#### VNC Desktop (Port 6080)
- **Purpose**: Full Ubuntu desktop environment
- **Features**:
  - Complete Linux desktop (XFCE)
  - Pre-installed applications (Firefox, LibreOffice, etc.)
  - File manager and terminal access
- **Best for**: Direct desktop interaction and file management

#### Combined Interface (Port 8080)
- **Purpose**: Integrated view of chat and desktop
- **Features**:
  - Side-by-side chat and desktop view
  - Real-time desktop streaming
  - Synchronized interactions
- **Best for**: Watching Claude interact with the desktop

### Configuration

#### API Key Setup
1. Open Settings (gear icon in header)
2. Enter your Anthropic API key in the "API Configuration" section
3. Click "Save Settings"
4. The key is securely stored and will persist between app restarts

#### Display Settings
1. Open Settings
2. Adjust "Screen Width" and "Screen Height" as needed
3. Click "Save Settings"
4. Restart the VM for changes to take effect

#### Recommended Settings
- **Screen Resolution**: 1024x768 (default, optimal for Claude)
- **Higher resolutions**: 1280x720, 1366x768 (acceptable)
- **Note**: Resolutions above 1920x1080 may impact performance

### Monitoring and Logs

#### VM Status
- **Header indicator**: Shows current VM state with color coding
  - 🔴 Red: Stopped or error
  - 🟡 Yellow: Starting/stopping
  - 🟢 Green: Running
- **Dashboard**: Detailed status information and resource usage

#### System Logs
1. Click the "Logs" tab at the bottom
2. View real-time system messages
3. Use "Refresh" to update logs
4. Use "Clear Logs" to reset the log view

#### Performance Monitoring
- **CPU Usage**: Shows container CPU utilization
- **Memory Usage**: Current RAM usage vs. allocated
- **Network Activity**: Upload/download statistics
- **Services Status**: Individual service health

## Troubleshooting

### Common Issues

#### VM Won't Start
**Symptoms**: "Start VM" button doesn't work, error messages
**Solutions**:
1. Check system resources (RAM, disk space)
2. Restart the desktop application
3. Check logs for specific error messages
4. Verify Podman is working: restart the app

#### Can't Access Interfaces
**Symptoms**: Quick access buttons are disabled or show errors
**Solutions**:
1. Ensure VM is running (green status indicator)
2. Wait a few extra seconds for services to start
3. Try refreshing the interface or restarting the VM
4. Check firewall settings (ports 5900, 6080, 8080, 8501)

#### Performance Issues
**Symptoms**: Slow VM, high CPU usage, interface lag
**Solutions**:
1. Lower the screen resolution in settings
2. Close other applications to free up RAM
3. Ensure adequate disk space (2GB+ free)
4. Restart the VM to clear memory

#### API Key Issues
**Symptoms**: Claude doesn't respond, authentication errors
**Solutions**:
1. Verify API key is correct (starts with `sk-`)
2. Check API key permissions in Anthropic Console
3. Re-enter the API key in settings
4. Restart the VM after updating the key

### Advanced Troubleshooting

#### Debug Mode
To enable debug logging:
1. Close the application
2. Start from terminal/command line with `--dev` flag
3. Check the developer console for detailed logs

#### Reset Application
To completely reset the application:
1. Stop the VM
2. Close the application
3. Delete configuration directory:
   - macOS: `~/Library/Application Support/Computer Use Demo`
   - Windows: `%APPDATA%/Computer Use Demo`
   - Linux: `~/.config/Computer Use Demo`
4. Restart the application

#### Container Issues
If the VM container is corrupted:
1. Stop the VM
2. The application will automatically recreate the container on next start
3. Configuration and data are preserved

## Development

### Project Structure

```
desktop-app/
├── src/                          # Application source code
│   ├── main.js                   # Electron main process
│   ├── preload.js               # Secure IPC bridge
│   ├── renderer/                # UI components
│   │   ├── index.html           # Main interface
│   │   ├── styles.css           # Application styles
│   │   └── script.js            # UI logic
│   └── services/                # Backend services
│       ├── vm-manager.js        # VM lifecycle management
│       └── container-service.js # Container operations
├── resources/                   # Static resources
│   ├── icons/                   # Application icons
│   └── entitlements.mac.plist   # macOS permissions
├── bundled-vm/                  # VM components
│   ├── container-image/         # Ubuntu container image
│   └── runtime/                 # Podman binaries
├── scripts/                     # Build scripts
│   ├── build-desktop-app.sh     # Main build script
│   └── prepare-vm-image.sh      # VM preparation
├── package.json                 # Dependencies and build config
└── README.md                    # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on your target platform
5. Submit a pull request

### Testing

#### Manual Testing
1. Build the application for your platform
2. Install and run the application
3. Test all VM operations (start, stop, restart)
4. Verify all interfaces are accessible
5. Test API key configuration
6. Check logs and error handling

#### Automated Testing
```bash
cd desktop-app
npm test  # Run unit tests
npm run test:e2e  # Run end-to-end tests (if available)
```

## License

This project is licensed under the same license as the main Computer Use Demo project.

## Support

For issues and questions:
1. Check this README for common solutions
2. Search existing issues in the repository
3. Create a new issue with detailed information:
   - Operating system and version
   - Application version
   - Steps to reproduce
   - Error messages or logs
   - Screenshots if applicable

## Changelog

### Version 1.0.0
- Initial release
- Cross-platform desktop application
- Self-contained Ubuntu VM
- Bundled Podman runtime
- Modern UI with real-time monitoring
- Support for macOS, Windows, and Linux 