const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ftpAPI', {
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    pickEditor: () => ipcRenderer.invoke('pick-editor'),

    // Connection management
    connect: (connectionInfo) => ipcRenderer.invoke('connect-ftp', connectionInfo),
    disconnect: (params) => ipcRenderer.invoke('disconnect-ftp', params),
    disconnectAll: () => ipcRenderer.invoke('disconnect-all-ftp'),
    getSavedConnections: () => ipcRenderer.invoke('get-saved-connections'),
    getRecentConnections: () => ipcRenderer.invoke('get-recent-connections'),
    saveConnection: (connection) => ipcRenderer.invoke('save-connection', connection),
    deleteConnection: (connectionId) => ipcRenderer.invoke('delete-connection', connectionId),

    // File/directory operations
    listDirectory: (params) => ipcRenderer.invoke('list-directory', params),
    changeDirectory: (params) => ipcRenderer.invoke('change-directory', params),
    currentDirectory: (params) => ipcRenderer.invoke('current-directory', params),
    downloadFile: (params) => ipcRenderer.invoke('download-file', params),
    uploadFile: (params) => ipcRenderer.invoke('upload-file', params),
    deleteItem: (params) => ipcRenderer.invoke('delete-item', params),
    createDirectory: (params) => ipcRenderer.invoke('create-directory', params),


    // File editing
    editFile: (params) => ipcRenderer.invoke('edit-file', params),
    saveEditedFile: (fileInfo) => ipcRenderer.invoke('save-edited-file', fileInfo),
    createTempFile: () => ipcRenderer.invoke('createTempFile'),
    uploadEmptyFile: (params) => ipcRenderer.invoke('uploadEmptyFile', params)

});