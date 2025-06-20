// Computer Use Demo Desktop App - Renderer Script

class ClaudeDesktopApp {
    constructor() {
        this.vmStatus = 'initializing';
        this.isDashboardOpen = false;
        this.initializeEventListeners();
        this.startStatusPolling();
        this.initializeApp();
    }

    initializeEventListeners() {
        // Dashboard toggle
        document.getElementById('dashboardToggle').addEventListener('click', () => {
            this.toggleDashboard();
        });

        document.getElementById('closeDashboard').addEventListener('click', () => {
            this.closeDashboard();
        });

        // VM Controls
        document.getElementById('startVmBtn').addEventListener('click', () => {
            this.startVM();
        });

        document.getElementById('stopVmBtn').addEventListener('click', () => {
            this.stopVM();
        });

        document.getElementById('restartVmBtn').addEventListener('click', () => {
            this.restartVM();
        });

        document.getElementById('startInterfaceBtn').addEventListener('click', () => {
            this.startVM();
        });

        // Access buttons
        document.getElementById('openStreamlitBtn').addEventListener('click', () => {
            this.loadInterface('http://localhost:8501');
        });

        document.getElementById('openVncBtn').addEventListener('click', () => {
            this.loadInterface('http://localhost:6080');
        });

        document.getElementById('openCombinedBtn').addEventListener('click', () => {
            this.loadInterface('http://localhost:8080');
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
            this.closeSettings();
        });

        // IPC status updates
        window.electronAPI?.onStatusUpdate?.((data) => {
            this.handleStatusUpdate(data);
        });

        // Close dashboard when clicking outside
        document.addEventListener('click', (e) => {
            const dashboard = document.getElementById('dashboardSidebar');
            const toggle = document.getElementById('dashboardToggle');
            
            if (this.isDashboardOpen && 
                !dashboard.contains(e.target) && 
                !toggle.contains(e.target)) {
                this.closeDashboard();
            }
        });
    }

    async initializeApp() {
        this.showToast('Initializing Computer Use Demo...', 'info');
        
        // Get app info (don't wait for it)
        window.electronAPI.getAppInfo().then(appInfo => {
            console.log('App initialized:', appInfo);
        }).catch(error => {
            console.error('Failed to get app info:', error);
        });

        // Start checking VM status immediately and very frequently during startup
        this.updateVMStatus();
        
        // Start aggressive interface loading attempts immediately
        setTimeout(() => {
            console.log('Starting aggressive interface loading...');
            this.loadInterface('http://localhost:8080');
        }, 2000); // Try loading after just 2 seconds
        
        // Check status very frequently for the first 45 seconds
        let quickCheckCount = 0;
        const quickCheckInterval = setInterval(() => {
            this.updateVMStatus();
            quickCheckCount++;
            
            // Stop quick checking after 45 seconds (15 checks * 3 seconds)
            if (quickCheckCount >= 15) {
                clearInterval(quickCheckInterval);
            }
        }, 3000); // Every 3 seconds instead of 5
        
        // Also start a parallel loading attempt every 10 seconds for the first minute
        let parallelAttempts = 0;
        const parallelInterval = setInterval(() => {
            if (document.getElementById('claudeFrame').style.display === 'none') {
                console.log('Parallel loading attempt...');
                this.loadInterface('http://localhost:8080');
            }
            parallelAttempts++;
            if (parallelAttempts >= 6) {
                clearInterval(parallelInterval);
            }
        }, 10000);
    }

    toggleDashboard() {
        const sidebar = document.getElementById('dashboardSidebar');
        
        if (this.isDashboardOpen) {
            this.closeDashboard();
        } else {
            this.openDashboard();
        }
    }

    openDashboard() {
        const sidebar = document.getElementById('dashboardSidebar');
        sidebar.classList.add('open');
        this.isDashboardOpen = true;
        this.updateVMStatus(); // Refresh status when opening
    }

    closeDashboard() {
        const sidebar = document.getElementById('dashboardSidebar');
        sidebar.classList.remove('open');
        this.isDashboardOpen = false;
    }

    async startVM() {
        this.updateLoadingMessage('Starting VM...');
        this.showToast('Starting virtual machine...', 'info');
        
        try {
            const result = await window.electronAPI.startVM();
            if (result.success) {
                this.showToast('VM started successfully!', 'success');
                this.updateLoadingMessage('VM is starting up...');
                
                // Wait a bit for services to start, then load the interface
                setTimeout(() => {
                    this.loadInterface('http://localhost:8080'); // Combined interface by default
                }, 8000);
            } else {
                this.showToast(`Failed to start VM: ${result.error}`, 'error');
                this.updateLoadingMessage('Failed to start VM. Please try again.');
                this.showStartButton();
            }
        } catch (error) {
            console.error('Error starting VM:', error);
            this.showToast('Error starting VM. Please check the logs.', 'error');
            this.updateLoadingMessage('Error starting VM. Please try again.');
            this.showStartButton();
        }
    }

    async stopVM() {
        this.showToast('Stopping virtual machine...', 'info');
        
        try {
            const result = await window.electronAPI.stopVM();
            if (result.success) {
                this.showToast('VM stopped successfully!', 'success');
                this.showLoadingScreen();
                this.updateLoadingMessage('VM is stopped.');
                this.showStartButton();
            } else {
                this.showToast(`Failed to stop VM: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error stopping VM:', error);
            this.showToast('Error stopping VM. Please check the logs.', 'error');
        }
    }

    async restartVM() {
        this.showToast('Restarting virtual machine...', 'info');
        this.showLoadingScreen();
        this.updateLoadingMessage('Restarting VM...');
        
        try {
            const result = await window.electronAPI.restartVM();
            if (result.success) {
                this.showToast('VM restarted successfully!', 'success');
                setTimeout(() => {
                    this.loadInterface('http://localhost:8080');
                }, 10000);
            } else {
                this.showToast(`Failed to restart VM: ${result.error}`, 'error');
                this.updateLoadingMessage('Failed to restart VM. Please try again.');
                this.showStartButton();
            }
        } catch (error) {
            console.error('Error restarting VM:', error);
            this.showToast('Error restarting VM. Please check the logs.', 'error');
            this.updateLoadingMessage('Error restarting VM. Please try again.');
            this.showStartButton();
        }
    }

    loadInterface(url, retryCount = 0, maxRetries = 15) {
        const frame = document.getElementById('claudeFrame');
        const loading = document.getElementById('interfaceLoading');
        
        this.updateLoadingMessage(`Loading Claude interface... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // Much shorter timeout for faster attempts
        const timeout = retryCount < 3 ? 5000 : 
                       retryCount < 8 ? 7000 : 10000; // 5s for first 3, 7s for next 5, then 10s
        const loadTimeout = setTimeout(() => {
            this.handleLoadFailure(url, retryCount, maxRetries);
        }, timeout);
        
        frame.onload = () => {
            clearTimeout(loadTimeout);
            
            // Check if the page actually loaded content (not an error page)
            // Shorter wait time for faster loading
            setTimeout(() => {
                try {
                    // Try to access the iframe content to verify it loaded properly
                    const iframeDoc = frame.contentDocument || frame.contentWindow.document;
                    if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.length > 100) {
                        loading.style.display = 'none';
                        frame.style.display = 'block';
                        this.showToast('Claude interface loaded successfully!', 'success');
                        console.log('Interface loaded successfully via content check');
                    } else {
                        throw new Error('Interface content not fully loaded');
                    }
                } catch (error) {
                    // If we can't access iframe content (CORS), assume it loaded if no error
                    // This is common with cross-origin iframes
                    loading.style.display = 'none';
                    frame.style.display = 'block';
                    this.showToast('Claude interface loaded successfully!', 'success');
                    console.log('Interface loaded successfully via CORS assumption');
                }
            }, 1000); // Reduced from 2 seconds to 1 second
        };
        
        frame.onerror = () => {
            clearTimeout(loadTimeout);
            this.handleLoadFailure(url, retryCount, maxRetries);
        };
        
        frame.src = url;
    }
    
    async checkServiceHealth(url) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors',
                timeout: 5000 
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    handleLoadFailure(url, retryCount, maxRetries) {
        if (retryCount < maxRetries) {
            const nextRetry = retryCount + 1;
            // Ultra-fast retries: 0.5s, 1s, 1s, 1.5s, 2s, then 1.5s intervals
            const waitTime = retryCount === 0 ? 500 :
                           retryCount === 1 ? 1000 :
                           retryCount < 4 ? 1000 + ((retryCount - 1) * 500) :
                           retryCount < 8 ? 2000 : 1500;
            
            // Try different URLs on different attempts
            let nextUrl = url;
            if (retryCount === 4) {
                nextUrl = 'http://localhost:8501'; // Try Streamlit interface
                this.updateLoadingMessage(`Trying Streamlit interface... (${nextRetry}/${maxRetries + 1})`);
            } else if (retryCount === 8) {
                nextUrl = 'http://localhost:6080'; // Try VNC interface
                this.updateLoadingMessage(`Trying VNC interface... (${nextRetry}/${maxRetries + 1})`);
            } else if (retryCount === 12) {
                nextUrl = 'http://localhost:8080'; // Back to combined
                this.updateLoadingMessage(`Trying combined interface again... (${nextRetry}/${maxRetries + 1})`);
            } else {
                this.updateLoadingMessage(`Retrying in ${waitTime/1000} seconds... (${nextRetry}/${maxRetries + 1})`);
            }
            
            if (waitTime <= 2000) {
                this.showToast(`Quick retry in ${waitTime/1000}s...`, 'info');
            } else {
                this.showToast(`Interface not ready, retrying in ${waitTime/1000} seconds...`, 'warning');
            }
            
            setTimeout(async () => {
                // Skip health check for very fast retries to avoid delays
                if (waitTime <= 2000 || retryCount > 3) {
                    this.loadInterface(nextUrl, nextRetry, maxRetries);
                } else {
                    // Quick health check before retry
                    const isHealthy = await this.checkServiceHealth(nextUrl);
                    if (isHealthy) {
                        this.loadInterface(nextUrl, nextRetry, maxRetries);
                    } else {
                        // Service still not ready, try again with shorter wait
                        setTimeout(() => {
                            this.loadInterface(nextUrl, nextRetry, maxRetries);
                        }, 1000);
                    }
                }
            }, waitTime);
        } else {
            this.showToast('Failed to load interface after multiple attempts. Please check VM status.', 'error');
            this.updateLoadingMessage('Failed to load interface. Try restarting the VM.');
            this.showStartButton();
        }
    }

    showLoadingScreen() {
        const frame = document.getElementById('claudeFrame');
        const loading = document.getElementById('interfaceLoading');
        
        frame.style.display = 'none';
        loading.style.display = 'flex';
        this.hideStartButton();
    }

    updateLoadingMessage(message) {
        const messageEl = document.getElementById('loadingMessage');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    showStartButton() {
        const button = document.getElementById('startInterfaceBtn');
        if (button) {
            button.style.display = 'inline-flex';
        }
    }

    hideStartButton() {
        const button = document.getElementById('startInterfaceBtn');
        if (button) {
            button.style.display = 'none';
        }
    }

    async updateVMStatus() {
        try {
            const status = await window.electronAPI.getVMStatus();
            this.vmStatus = status.status || 'unknown';
            this.updateStatusDisplay(status);
            this.updateSystemInfo(status);
        } catch (error) {
            console.error('Error getting VM status:', error);
            this.updateStatusDisplay({ status: 'error', error: error.message });
        }
    }

    updateStatusDisplay(status) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        const containerStatus = document.getElementById('containerStatus');
        const frame = document.getElementById('claudeFrame');
        const loading = document.getElementById('interfaceLoading');
        
        // Update status indicator
        indicator.className = 'status-indicator';
        
        switch (status.status) {
            case 'running':
                indicator.classList.add('running');
                text.textContent = 'Running';
                
                // Auto-load interface if VM is running and interface isn't loaded yet
                if (frame.src === 'about:blank' || frame.src === '' || frame.style.display === 'none') {
                    console.log('VM is running, attempting to load interface...');
                    // Start loading immediately when VM is detected as running
                    this.loadInterface('http://localhost:8080');
                }
                break;
            case 'starting':
                indicator.classList.add('connecting');
                text.textContent = 'Starting...';
                
                // Start pre-loading attempts while VM is starting - much more aggressive
                if (frame.src === 'about:blank' || frame.src === '') {
                    console.log('VM is starting, beginning immediate pre-load attempts...');
                    // Start trying immediately
                    setTimeout(() => this.loadInterface('http://localhost:8080'), 1000);
                    // Then try again every 3 seconds
                    setTimeout(() => this.loadInterface('http://localhost:8080'), 4000);
                    setTimeout(() => this.loadInterface('http://localhost:8080'), 7000);
                }
                break;
            case 'stopping':
                indicator.classList.add('connecting');
                text.textContent = 'Stopping...';
                break;
            case 'stopped':
                text.textContent = 'Stopped';
                // Show loading screen when stopped
                if (frame.style.display !== 'none') {
                    this.showLoadingScreen();
                    this.updateLoadingMessage('VM is stopped.');
                    this.showStartButton();
                }
                break;
            case 'error':
                indicator.classList.add('error');
                text.textContent = 'Error';
                break;
            case 'not-initialized':
                text.textContent = 'Initializing...';
                break;
            default:
                text.textContent = 'Unknown';
        }

        // Update container status
        if (containerStatus) {
            containerStatus.textContent = status.status === 'running' ? 'Running' : 'Stopped';
        }
    }

    updateSystemInfo(status) {
        const cpuUsage = document.getElementById('cpuUsage');
        const memoryUsage = document.getElementById('memoryUsage');
        
        if (cpuUsage) {
            cpuUsage.textContent = status.cpu ? `${status.cpu}%` : '-';
        }
        
        if (memoryUsage) {
            memoryUsage.textContent = status.memory ? `${status.memory} MB` : '-';
        }
    }

    startStatusPolling() {
        // Poll VM status every 5 seconds
        setInterval(() => {
            this.updateVMStatus();
        }, 5000);
        
        // Also add a backup check every 5 seconds to force interface loading if VM is running
        setInterval(() => {
            const frame = document.getElementById('claudeFrame');
            const loading = document.getElementById('interfaceLoading');
            
            if (this.vmStatus === 'running' && 
                (frame.style.display === 'none' || loading.style.display !== 'none')) {
                console.log('Backup check: VM running but interface not loaded, forcing load...');
                this.loadInterface('http://localhost:8080');
            }
        }, 5000); // Reduced from 10 seconds to 5 seconds
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    }

    async saveSettings() {
        const apiKey = document.getElementById('apiKeyInput').value;
        const resolution = document.getElementById('resolutionSelect').value;
        
        if (apiKey) {
            try {
                const result = await window.electronAPI.setApiKey(apiKey);
                if (result.success) {
                    this.showToast('API key saved successfully!', 'success');
                } else {
                    this.showToast(`Failed to save API key: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error saving API key:', error);
                this.showToast('Error saving API key.', 'error');
            }
        }
        
        this.closeSettings();
        
        // Clear the API key input for security
        document.getElementById('apiKeyInput').value = '';
    }

    handleStatusUpdate(data) {
        const { message, type, timestamp } = data;
        this.showToast(message, type);
        
        // Update loading message if on loading screen
        const loading = document.getElementById('interfaceLoading');
        if (loading.style.display !== 'none') {
            this.updateLoadingMessage(message);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('statusToast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = icons[type] || icons.info;
        messageEl.textContent = message;
        
        // Set toast class for styling
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClaudeDesktopApp();
}); 