const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ftp = require('basic-ftp');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');


// Initialize persistent storage with schema
const store = new Store({
    schema: {
        connections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    host: { type: 'string' },
                    port: { type: 'string' },
                    username: { type: 'string' },
                    password: { type: 'string' },
                    secure: { type: 'boolean' }
                }
            },
            default: []
        },
        settings: {
            type: 'object',
            properties: {
                defaultEditor: { type: 'string', default: '' },
                theme: { type: 'string', default: 'light' },
                showHiddenFiles: { type: 'boolean', default: false },
                transferMode: { type: 'string', default: 'auto' }
            },
            default: {
                defaultEditor: '',
                theme: 'light',
                showHiddenFiles: false,
                transferMode: 'auto'
            }
        },
        recentConnections: {
            type: 'array',
            maxItems: 10,
            default: []
        }
    }
});

let mainWindow;

function createWindow() {
    // Different configs for different platforms
    let windowConfig = {
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    };

    // macOS-specific config 
    if (process.platform === 'darwin') {
        windowConfig.titleBarStyle = 'hiddenInset';
    }
    // Windows-specific config
    else if (process.platform === 'win32') {
        windowConfig.autoHideMenuBar = true; // Menu hidden but accessible via Alt key
    }
    // Linux config - standard
    else {
        windowConfig.autoHideMenuBar = true;
    }

    mainWindow = new BrowserWindow(windowConfig);

    // Remove application menu on all platforms
    mainWindow.setMenu(null);

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    autoUpdater.checkForUpdatesAndNotify();

});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit();
});

// Listen for update events
autoUpdater.on('update-available', () => {
    console.log('Update available.');
});

autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded. Installing now...');
    autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (err) => {
    console.log('Update error:', err);
});


// Map to store active FTP connections
const ftpConnections = new Map();

// Get settings
ipcMain.handle('get-settings', () => {
    return store.get('settings');
});

// Save settings
ipcMain.handle('save-settings', (event, settings) => {
    store.set('settings', settings);
    return { success: true };
});

// Create a new FTP connection
ipcMain.handle('connect-ftp', async(event, connectionInfo) => {
    try {
        // Create a new FTP client
        const ftpClient = new ftp.Client();
        ftpClient.ftp.verbose = true;

        // Connect to the server
        await ftpClient.access({
            host: connectionInfo.host,
            port: connectionInfo.port,
            user: connectionInfo.username,
            password: connectionInfo.password,
            secure: connectionInfo.secure
        });

        // Generate connection ID if not provided
        const connectionId = connectionInfo.id || Date.now().toString();

        // Store the connection
        ftpConnections.set(connectionId, {
            client: ftpClient,
            info: {
                ...connectionInfo,
                id: connectionId
            }
        });

        // Get current directory
        const currentDir = await ftpClient.pwd();

        // Save connection settings if "save" is true
        if (connectionInfo.save) {
            let savedConnections = store.get('connections') || [];

            // Add connection name if provided, or generate one
            const connectionName = connectionInfo.name || `${connectionInfo.host} (${connectionInfo.username})`;

            // Check if we should update an existing connection
            const existingIndex = savedConnections.findIndex(conn => conn.id === connectionInfo.id);

            if (existingIndex >= 0) {
                // Update existing connection
                savedConnections[existingIndex] = {
                    ...savedConnections[existingIndex],
                    name: connectionName,
                    host: connectionInfo.host,
                    port: connectionInfo.port,
                    username: connectionInfo.username,
                    password: connectionInfo.password,
                    secure: connectionInfo.secure
                };
            } else {
                // Add new connection
                savedConnections.push({
                    id: connectionId,
                    name: connectionName,
                    host: connectionInfo.host,
                    port: connectionInfo.port,
                    username: connectionInfo.username,
                    password: connectionInfo.password,
                    secure: connectionInfo.secure
                });
            }

            store.set('connections', savedConnections);

            // Add to recent connections
            addToRecentConnections({
                id: connectionId,
                name: connectionName,
                host: connectionInfo.host,
                username: connectionInfo.username
            });
        }

        return {
            success: true,
            connectionId,
            currentDir,
            info: connectionInfo
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get saved connections
ipcMain.handle('get-saved-connections', () => {
    return store.get('connections') || [];
});

// Get recent connections
ipcMain.handle('get-recent-connections', () => {
    return store.get('recentConnections') || [];
});

// Add to recent connections
function addToRecentConnections(connection) {
    let recentConnections = store.get('recentConnections') || [];

    // Remove if already exists
    recentConnections = recentConnections.filter(conn => conn.id !== connection.id);

    // Add to beginning of array
    recentConnections.unshift(connection);

    // Limit to 10 items
    if (recentConnections.length > 10) {
        recentConnections = recentConnections.slice(0, 10);
    }

    store.set('recentConnections', recentConnections);
}

// Save new connection
ipcMain.handle('save-connection', (event, connection) => {
    try {
        let connections = store.get('connections') || [];

        // If editing existing connection
        if (connection.id) {
            const index = connections.findIndex(c => c.id === connection.id);
            if (index !== -1) {
                connections[index] = connection;
            } else {
                connections.push(connection);
            }
        } else {
            // New connection
            connection.id = Date.now().toString();
            connections.push(connection);
        }

        store.set('connections', connections);
        return { success: true, connections };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Delete saved connection
ipcMain.handle('delete-connection', (event, connectionId) => {
    try {
        let connections = store.get('connections') || [];
        connections = connections.filter(c => c.id !== connectionId);
        store.set('connections', connections);

        // Also remove from recent connections
        let recentConnections = store.get('recentConnections') || [];
        recentConnections = recentConnections.filter(c => c.id !== connectionId);
        store.set('recentConnections', recentConnections);

        return { success: true, connections };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// List directory contents
ipcMain.handle('list-directory', async(event, { connectionId, path }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        const list = await connection.client.list(path);
        return { success: true, files: list };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Change directory
ipcMain.handle('change-directory', async(event, { connectionId, path }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        await connection.client.cd(path);
        const currentDir = await connection.client.pwd();
        return { success: true, path: currentDir };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get current working directory
ipcMain.handle('current-directory', async(event, { connectionId }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        const currentDir = await connection.client.pwd();
        return { success: true, path: currentDir };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Download file
ipcMain.handle('download-file', async(event, { connectionId, remotePath, fileName }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        // Open file save dialog
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Save file',
            defaultPath: fileName
        });

        if (canceled) {
            return { success: false, canceled: true };
        }

        await connection.client.downloadTo(filePath, remotePath);
        return { success: true, filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Upload file
ipcMain.handle('upload-file', async(event, { connectionId }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        // Open file selection dialog
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile']
        });

        if (canceled) {
            return { success: false, canceled: true };
        }

        const filePath = filePaths[0];
        const fileName = path.basename(filePath);

        await connection.client.uploadFrom(filePath, fileName);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Edit file
ipcMain.handle('edit-file', async(event, { connectionId, remotePath, fileName }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        // Create a temporary directory for editing
        const tempDir = path.join(app.getPath('temp'), 'multi-ftp-client-temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create a unique filename for this edit session
        const localFilePath = path.join(tempDir, connectionId + '_' + fileName);
        const fileInfo = {
            connectionId,
            remotePath,
            localPath: localFilePath,
            fileName,
            lastModified: null
        };

        // Download the file
        await connection.client.downloadTo(localFilePath, remotePath);

        // Get file stats for tracking modifications
        const stats = fs.statSync(localFilePath);
        fileInfo.lastModified = stats.mtime;

        // Get custom editor setting
        const settings = store.get('settings');
        const customEditor = settings.defaultEditor;

        // Open with custom editor if specified, otherwise use system default
        if (customEditor && customEditor.trim() !== '') {
            // Launch custom editor
            require('child_process').exec(`"${customEditor}" "${localFilePath}"`);
        } else {
            // Open with system default editor
            shell.openPath(localFilePath);
        }

        // Return file info for tracking
        return {
            success: true,
            fileInfo
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Save edited file back to server
ipcMain.handle('save-edited-file', async(event, fileInfo) => {
    try {
        // Check if the connection still exists
        const connection = ftpConnections.get(fileInfo.connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        // Check if file has been modified since we downloaded it
        const stats = fs.statSync(fileInfo.localPath);

        if (stats.mtime > fileInfo.lastModified) {
            // File was modified, upload it back
            await connection.client.uploadFrom(fileInfo.localPath, fileInfo.remotePath);
            return { success: true, uploaded: true };
        } else {
            // File wasn't modified
            return { success: true, uploaded: false };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Delete file or directory
ipcMain.handle('delete-item', async(event, { connectionId, path, isDirectory }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        if (isDirectory) {
            await connection.client.removeDir(path);
        } else {
            await connection.client.remove(path);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Create directory
ipcMain.handle('create-directory', async(event, { connectionId, dirName }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        await connection.client.send(`MKD ${dirName}`);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Disconnect a specific FTP connection
ipcMain.handle('disconnect-ftp', async(event, { connectionId }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (connection) {
            connection.client.close();
            ftpConnections.delete(connectionId);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Disconnect all FTP connections
ipcMain.handle('disconnect-all-ftp', async() => {
    try {
        for (const [connectionId, connection] of ftpConnections.entries()) {
            connection.client.close();
            ftpConnections.delete(connectionId);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Open the editor picker dialog
ipcMain.handle('pick-editor', async() => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select Default Editor',
            properties: ['openFile'],
            filters: [
                { name: 'Executable', extensions: ['exe', 'app', 'bat', 'sh'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled) {
            return { success: false, canceled: true };
        }

        return { success: true, path: filePaths[0] };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Upload empty file
ipcMain.handle('uploadEmptyFile', async(event, { connectionId, localPath, remotePath }) => {
    try {
        const connection = ftpConnections.get(connectionId);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        await connection.client.uploadFrom(localPath, remotePath);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});


// Create temporary file
ipcMain.handle('createTempFile', async() => {
    try {
        // Create a temporary directory for editing
        const tempDir = path.join(app.getPath('temp'), 'multi-ftp-client-temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create a unique temporary file
        const tempFilePath = path.join(tempDir, `temp_file_${Date.now()}.txt`);
        fs.writeFileSync(tempFilePath, ''); // Create empty file

        return { success: true, path: tempFilePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});