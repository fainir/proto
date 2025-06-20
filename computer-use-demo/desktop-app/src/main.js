const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const os = require('os');

const VMManager = require('./services/vm-manager');
const ContainerService = require('./services/container-service');

class ComputerUseDemoApp {
  constructor() {
    this.mainWindow = null;
    this.vmManager = new VMManager();
    this.containerService = new ContainerService();
    this.isDev = process.argv.includes('--dev');
    this.isQuitting = false;
    
    // Set environment variable for VM Manager to detect dev mode
    if (this.isDev) {
      process.env.ELECTRON_DEV_MODE = 'true';
    }
  }

  async initialize() {
    await app.whenReady();
    
    // Set up IPC handlers FIRST before creating window
    this.setupAppEvents();
    
    // Set up application menu
    this.createMenu();
    
    // Create main window
    await this.createMainWindow();
    
    // Initialize VM and container services
    await this.initializeServices();
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: this.getAppIcon(),
      show: false
    });

    // Load the renderer
    if (this.isDev) {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window close
    this.mainWindow.on('close', async (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        await this.handleAppClose();
      }
    });
  }

  getAppIcon() {
    const platform = process.platform;
    const iconPath = path.join(__dirname, '..', 'resources', 'icons');
    
    if (platform === 'darwin') {
      return path.join(iconPath, 'icon.icns');
    } else if (platform === 'win32') {
      return path.join(iconPath, 'icon.ico');
    } else {
      return path.join(iconPath, 'icon.png');
    }
  }

  createMenu() {
    const template = [
      {
        label: 'Computer Use Demo',
        submenu: [
          {
            label: 'About Computer Use Demo',
            click: () => this.showAboutDialog()
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showPreferences()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => this.handleAppClose()
          }
        ]
      },
      {
        label: 'VM',
        submenu: [
          {
            label: 'Start VM',
            click: () => this.startVM()
          },
          {
            label: 'Stop VM',
            click: () => this.stopVM()
          },
          {
            label: 'Restart VM',
            click: () => this.restartVM()
          },
          { type: 'separator' },
          {
            label: 'VM Console',
            click: () => this.openVMConsole()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://docs.anthropic.com/claude/docs')
          },
          {
            label: 'GitHub Repository',
            click: () => shell.openExternal('https://github.com/anthropics/anthropic-quickstarts')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  async initializeServices() {
    try {
      // Initialize VM Manager
      await this.vmManager.initialize();
      
      // Initialize Container Service
      await this.containerService.initialize();
      
      // Send status to renderer
      this.sendStatusUpdate('Services initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize services:', error);
      this.sendStatusUpdate(`Error: ${error.message}`, 'error');
    }
  }

  setupAppEvents() {
    // IPC handlers with error handling
    ipcMain.handle('get-vm-status', async () => {
      try {
        return this.vmManager.isInitialized ? await this.vmManager.getStatus() : { status: 'not-initialized' };
      } catch (error) {
        console.error('Error getting VM status:', error);
        return { status: 'error', error: error.message };
      }
    });
    
    ipcMain.handle('start-vm', async () => {
      try {
        return await this.startVM();
      } catch (error) {
        console.error('Error starting VM:', error);
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('stop-vm', async () => {
      try {
        return await this.stopVM();
      } catch (error) {
        console.error('Error stopping VM:', error);
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('restart-vm', async () => {
      try {
        return await this.restartVM();
      } catch (error) {
        console.error('Error restarting VM:', error);
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('get-container-logs', async () => {
      try {
        return this.containerService ? await this.containerService.getLogs() : [];
      } catch (error) {
        console.error('Error getting container logs:', error);
        return [];
      }
    });
    
    ipcMain.handle('set-api-key', async (event, apiKey) => {
      try {
        return await this.setApiKey(apiKey);
      } catch (error) {
        console.error('Error setting API key:', error);
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('get-app-info', () => {
      try {
        return this.getAppInfo();
      } catch (error) {
        console.error('Error getting app info:', error);
        return { error: error.message };
      }
    });
    
    // App events
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.handleAppClose();
      }
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createMainWindow();
      }
    });

    app.on('before-quit', async (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        await this.handleAppClose();
      }
    });
  }

  async startVM() {
    try {
      this.sendStatusUpdate('Starting VM...', 'info');
      await this.vmManager.start();
      await this.containerService.start();
      this.sendStatusUpdate('VM started successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Failed to start VM:', error);
      this.sendStatusUpdate(`Failed to start VM: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async stopVM() {
    try {
      this.sendStatusUpdate('Stopping VM...', 'info');
      await this.containerService.stop();
      await this.vmManager.stop();
      this.sendStatusUpdate('VM stopped successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Failed to stop VM:', error);
      this.sendStatusUpdate(`Failed to stop VM: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async restartVM() {
    try {
      await this.stopVM();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await this.startVM();
      return { success: true };
    } catch (error) {
      console.error('Failed to restart VM:', error);
      return { success: false, error: error.message };
    }
  }

  sendStatusUpdate(message, type = 'info') {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('status-update', { message, type, timestamp: Date.now() });
    }
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Computer Use Demo',
      message: 'Computer Use Demo',
      detail: 'Anthropic Claude Computer Use Demo Desktop Application\n\nA desktop application that provides Claude with computer use capabilities in a sandboxed Ubuntu environment.',
      buttons: ['OK']
    });
  }

  showPreferences() {
    // TODO: Implement preferences window
    this.sendStatusUpdate('Preferences window not yet implemented', 'info');
  }

  openVMConsole() {
    // TODO: Implement VM console window
    this.sendStatusUpdate('VM console not yet implemented', 'info');
  }

  async setApiKey(apiKey) {
    try {
      // Store API key securely
      const configDir = path.join(os.homedir(), '.anthropic');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const configFile = path.join(configDir, 'config.json');
      const config = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : {};
      config.apiKey = apiKey;
      
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      
      // Update container environment
      await this.containerService.setEnvironmentVariable('ANTHROPIC_API_KEY', apiKey);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to set API key:', error);
      return { success: false, error: error.message };
    }
  }

  getAppInfo() {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    };
  }

  async handleAppClose() {
    this.isQuitting = true;
    
    try {
      // Stop services gracefully
      await this.containerService.stop();
      await this.vmManager.stop();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    // Quit the app
    app.quit();
  }
}

// Initialize and start the application
const computerUseDemoApp = new ComputerUseDemoApp();

// Handle app startup
app.whenReady().then(async () => {
  await computerUseDemoApp.initialize();
}).catch(error => {
  console.error('Failed to start application:', error);
  app.quit();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (computerUseDemoApp.mainWindow) {
      if (computerUseDemoApp.mainWindow.isMinimized()) {
        computerUseDemoApp.mainWindow.restore();
      }
      computerUseDemoApp.mainWindow.focus();
    }
  });
} 