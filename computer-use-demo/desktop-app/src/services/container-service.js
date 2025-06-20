const path = require('path');
const fs = require('fs');

class ContainerService {
  constructor() {
    this.isInitialized = false;
    this.logs = [];
    this.maxLogs = 1000;
    this.environment = new Map();
  }

  async initialize() {
    console.log('Initializing Container Service...');
    
    try {
      // Set default environment variables
      this.environment.set('WIDTH', '1024');
      this.environment.set('HEIGHT', '768');
      this.environment.set('DISPLAY_NUM', '1');
      
      // Load saved environment variables if they exist
      await this.loadEnvironmentVariables();
      
      this.isInitialized = true;
      console.log('Container Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Container Service:', error);
      throw error;
    }
  }

  async loadEnvironmentVariables() {
    try {
      const configPath = path.join(require('os').homedir(), '.anthropic', 'container-env.json');
      
      if (fs.existsSync(configPath)) {
        const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        Object.entries(envConfig).forEach(([key, value]) => {
          this.environment.set(key, value);
        });
        
        console.log('Loaded environment variables from config');
      }
    } catch (error) {
      console.warn('Failed to load environment variables:', error.message);
    }
  }

  async saveEnvironmentVariables() {
    try {
      const configDir = path.join(require('os').homedir(), '.anthropic');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const configPath = path.join(configDir, 'container-env.json');
      const envConfig = Object.fromEntries(this.environment);
      
      fs.writeFileSync(configPath, JSON.stringify(envConfig, null, 2));
      console.log('Saved environment variables to config');
    } catch (error) {
      console.error('Failed to save environment variables:', error);
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('Container Service not initialized');
    }
    
    console.log('Container Service start called (handled by VM Manager)');
    this.addLog('Container service started', 'info');
  }

  async stop() {
    console.log('Container Service stop called (handled by VM Manager)');
    this.addLog('Container service stopped', 'info');
  }

  async setEnvironmentVariable(key, value) {
    this.environment.set(key, value);
    await this.saveEnvironmentVariables();
    this.addLog(`Environment variable ${key} updated`, 'info');
  }

  getEnvironmentVariable(key) {
    return this.environment.get(key);
  }

  getAllEnvironmentVariables() {
    return Object.fromEntries(this.environment);
  }

  async getLogs() {
    return this.logs.slice(-this.maxLogs);
  }

  addLog(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    this.logs.push(logEntry);
    
    // Keep only the latest logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  clearLogs() {
    this.logs = [];
  }

  // Helper methods for specific container operations
  async getContainerStats() {
    // This would be implemented to get actual container statistics
    // For now, return mock data
    return {
      cpu: '12.5%',
      memory: '1.2GB / 4GB',
      network: {
        rx: '1.2MB',
        tx: '856KB'
      }
    };
  }

  async getPortMappings() {
    return {
      '5900': { name: 'VNC', description: 'VNC Server for remote desktop access' },
      '8501': { name: 'Streamlit', description: 'Streamlit web interface' },
      '6080': { name: 'noVNC', description: 'Web-based VNC client' },
      '8080': { name: 'Combined', description: 'Combined web interface' }
    };
  }

  async checkServices() {
    // This would check if all services within the container are running properly
    const services = [
      { name: 'X11VNC', status: 'running', port: 5900 },
      { name: 'noVNC', status: 'running', port: 6080 },
      { name: 'Streamlit', status: 'running', port: 8501 },
      { name: 'HTTP Server', status: 'running', port: 8080 },
      { name: 'Desktop Environment', status: 'running', port: null }
    ];
    
    return services;
  }

  async restartService(serviceName) {
    this.addLog(`Restarting service: ${serviceName}`, 'info');
    // This would implement actual service restart logic
    // For now, just log the action
    return { success: true, message: `Service ${serviceName} restarted` };
  }
}

module.exports = ContainerService; 