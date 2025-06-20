const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

class VMManager {
  constructor() {
    this.podmanPath = null;
    this.vmStatus = 'stopped';
    this.containerName = 'computer-use-demo';
    this.imageName = 'computer-use-demo:desktop';
    this.isInitialized = false;
    this.process = null;
  }

  async initialize() {
    console.log('Initializing VM Manager...');
    
    try {
      // Set up podman binary path based on platform and architecture
      await this.setupPodmanBinary();
      
      // Initialize podman machine if needed
      await this.initializePodman();
      
      // Build or load the container image
      await this.setupContainerImage();
      
      this.isInitialized = true;
      console.log('VM Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VM Manager:', error);
      throw error;
    }
  }

  async setupPodmanBinary() {
    const platform = process.platform;
    const arch = process.arch;
    
    // Determine the correct podman binary path
    let podmanDir;
    
    if (platform === 'darwin') {
      podmanDir = arch === 'arm64' ? 'mac/arm64' : 'mac/x64';
    } else if (platform === 'win32') {
      podmanDir = 'windows/x64';
    } else {
      podmanDir = arch === 'arm64' ? 'linux/arm64' : 'linux/x64';
    }
    
    // Path to bundled podman
    let appPath;
    if (process.env.ELECTRON_DEV_MODE === 'true') {
      // Development mode - use project directory
      appPath = path.join(__dirname, '..', '..');
    } else {
      // Production mode - use bundled resources
      appPath = process.resourcesPath || path.join(__dirname, '..', '..');
    }
    
    const bundledRuntimePath = path.join(appPath, 'bundled-runtime', 'podman', podmanDir);
    
    if (platform === 'win32') {
      this.podmanPath = path.join(bundledRuntimePath, 'bin', 'podman.exe');
    } else {
      this.podmanPath = path.join(bundledRuntimePath, 'bin', 'podman');
    }
    
    // Make sure the podman binary exists and is executable
    if (!fs.existsSync(this.podmanPath)) {
      throw new Error(`Podman binary not found at: ${this.podmanPath}`);
    }
    
    if (platform !== 'win32') {
      // Make sure it's executable
      try {
        await execAsync(`chmod +x "${this.podmanPath}"`);
      } catch (error) {
        console.warn('Failed to make podman executable:', error.message);
      }
    }
    
    console.log(`Using podman binary: ${this.podmanPath}`);
  }

  async initializePodman() {
    try {
      // Check if podman machine exists (mainly for macOS)
      if (process.platform === 'darwin') {
        try {
          await this.runPodmanCommand(['machine', 'list']);
        } catch (error) {
          // Create default podman machine if it doesn't exist
          console.log('Creating podman machine...');
          await this.runPodmanCommand(['machine', 'init', 'computer-use-demo', '--memory=4096', '--cpus=2']);
        }
        
        // Start the podman machine
        try {
          await this.runPodmanCommand(['machine', 'start', 'computer-use-demo']);
        } catch (error) {
          console.warn('Podman machine might already be running:', error.message);
        }
      }
      
      // Test podman connection
      await this.runPodmanCommand(['version']);
      console.log('Podman is ready');
      
    } catch (error) {
      console.error('Failed to initialize podman:', error);
      throw error;
    }
  }

  async setupContainerImage() {
    try {
      // Check if the image already exists
      try {
        await this.runPodmanCommand(['image', 'exists', this.imageName]);
        console.log('Container image already exists');
        return;
      } catch (error) {
        // Image doesn't exist, we need to build or load it
      }
      
      // Path to the bundled container image
      let appPath;
      if (process.env.ELECTRON_DEV_MODE === 'true') {
        // Development mode - use project directory
        appPath = path.join(__dirname, '..', '..');
      } else {
        // Production mode - use bundled resources
        appPath = process.resourcesPath || path.join(__dirname, '..', '..');
      }
      const imagePath = path.join(appPath, 'bundled-vm', 'container-image', 'computer-use-demo.tar');
      
      if (fs.existsSync(imagePath)) {
        console.log('Loading container image from bundle...');
        await this.runPodmanCommand(['load', '-i', imagePath]);
      } else {
        // Build the image from the bundled Dockerfile and context
        console.log('Building container image...');
        const contextPath = path.join(__dirname, '..', '..', '..');
        await this.runPodmanCommand(['build', '-t', this.imageName, '-f', 'Dockerfile', contextPath]);
      }
      
      console.log('Container image is ready');
      
    } catch (error) {
      console.error('Failed to setup container image:', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('VM Manager not initialized');
    }
    
    if (this.vmStatus === 'running') {
      console.log('VM is already running');
      return;
    }
    
    try {
      console.log('Starting VM...');
      this.vmStatus = 'starting';
      
      // Stop any existing container
      try {
        await this.runPodmanCommand(['stop', this.containerName]);
        await this.runPodmanCommand(['rm', this.containerName]);
      } catch (error) {
        // Container might not exist, that's fine
      }
      
      // Get API key from config
      const apiKey = await this.getApiKey();
      
      // Run the container
      const runArgs = [
        'run',
        '--rm',
        '--name', this.containerName,
        '-p', '5900:5900',    // VNC
        '-p', '8501:8501',    // Streamlit
        '-p', '6080:6080',    // noVNC
        '-p', '8080:8080',    // Combined interface
        '-e', `ANTHROPIC_API_KEY=${apiKey}`,
        '-e', 'WIDTH=1024',
        '-e', 'HEIGHT=768',
        '--privileged',       // Needed for some desktop functionality
        this.imageName
      ];
      
      this.process = spawn(this.podmanPath, runArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
      
      this.process.stdout.on('data', (data) => {
        console.log(`Container stdout: ${data}`);
      });
      
      this.process.stderr.on('data', (data) => {
        console.log(`Container stderr: ${data}`);
      });
      
      this.process.on('close', (code) => {
        console.log(`Container process exited with code ${code}`);
        this.vmStatus = 'stopped';
        this.process = null;
      });
      
      this.process.on('error', (error) => {
        console.error('Container process error:', error);
        this.vmStatus = 'error';
        this.process = null;
      });
      
      // Wait a bit for the container to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify the container is running
      await this.runPodmanCommand(['ps', '--filter', `name=${this.containerName}`]);
      
      this.vmStatus = 'running';
      console.log('VM started successfully');
      
    } catch (error) {
      this.vmStatus = 'error';
      console.error('Failed to start VM:', error);
      throw error;
    }
  }

  async stop() {
    if (this.vmStatus === 'stopped') {
      console.log('VM is already stopped');
      return;
    }
    
    try {
      console.log('Stopping VM...');
      this.vmStatus = 'stopping';
      
      // Stop the container gracefully
      await this.runPodmanCommand(['stop', this.containerName, '-t', '10']);
      
      // Kill the process if it's still running
      if (this.process && !this.process.killed) {
        this.process.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      }
      
      this.vmStatus = 'stopped';
      this.process = null;
      console.log('VM stopped successfully');
      
    } catch (error) {
      console.error('Failed to stop VM:', error);
      this.vmStatus = 'error';
      throw error;
    }
  }

  async getStatus() {
    if (!this.isInitialized) {
      return { status: 'not-initialized', message: 'VM Manager not initialized' };
    }
    
    try {
      // Check if container is running
      const result = await this.runPodmanCommand(['ps', '--filter', `name=${this.containerName}`, '--format', 'json']);
      const containers = JSON.parse(result.stdout || '[]');
      
      if (containers.length > 0) {
        this.vmStatus = 'running';
        return {
          status: this.vmStatus,
          message: 'VM is running',
          container: containers[0],
          ports: {
            vnc: 'localhost:5900',
            streamlit: 'http://localhost:8501',
            novnc: 'http://localhost:6080/vnc.html',
            combined: 'http://localhost:8080'
          }
        };
      } else {
        this.vmStatus = 'stopped';
        return {
          status: this.vmStatus,
          message: 'VM is stopped'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Error checking VM status: ${error.message}`
      };
    }
  }

  async getApiKey() {
    try {
      const configDir = path.join(os.homedir(), '.anthropic');
      const configFile = path.join(configDir, 'config.json');
      
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        return config.apiKey || '';
      }
      
      return '';
    } catch (error) {
      console.error('Failed to get API key:', error);
      return '';
    }
  }

  async runPodmanCommand(args) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.podmanPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Podman command failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = VMManager; 