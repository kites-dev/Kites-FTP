// Global state
const state = {
    activeView: 'home', // 'home', 'connection-manager', 'settings', or a connection ID
    connections: new Map(), // Map of active connections
    selectedItems: new Map(), // Map of selected items for each connection
    editedFiles: new Map(), // Map of edited files for each connection
    directoryCache: new Map(), // Cache of directory listings
    settings: {
        theme: 'light',
        defaultEditor: '',
        showHiddenFiles: false,
        transferMode: 'auto'
    }
};

// DOM Elements
const appContainer = document.getElementById('app-container');
const connectionTabs = document.getElementById('connection-tabs');
const homeTab = document.getElementById('home-tab');
const addConnectionTab = document.getElementById('add-connection-tab');

// Views
const homeView = document.getElementById('home-view');
const connectionManagerView = document.getElementById('connection-manager-view');
const settingsView = document.getElementById('settings-view');
const connectionViewTemplate = document.getElementById('connection-view-template');

// Home View Elements
const recentConnectionsContainer = document.getElementById('recent-connections');
const savedConnectionsContainer = document.getElementById('saved-connections');
const quickConnectForm = document.getElementById('quick-connect-form');
const quickHostInput = document.getElementById('quick-host');
const quickPortInput = document.getElementById('quick-port');
const quickUsernameInput = document.getElementById('quick-username');
const quickPasswordInput = document.getElementById('quick-password');
const quickSecureCheckbox = document.getElementById('quick-secure');
const quickSaveConnectionCheckbox = document.getElementById('quick-save-connection');
const quickNameInput = document.getElementById('quick-name');

// Connection Manager Elements
const connectionList = document.getElementById('connection-list');
const connectionFormContainer = document.getElementById('connection-form-container');
const connectionForm = document.getElementById('connection-form');
const connectionFormTitle = document.getElementById('connection-form-title');
const connectionIdInput = document.getElementById('connection-id');
const connectionNameInput = document.getElementById('connection-name');
const connectionHostInput = document.getElementById('connection-host');
const connectionPortInput = document.getElementById('connection-port');
const connectionUsernameInput = document.getElementById('connection-username');
const connectionPasswordInput = document.getElementById('connection-password');
const connectionSecureCheckbox = document.getElementById('connection-secure');

// Settings Elements
const settingsForm = document.getElementById('settings-form');
const themeLightRadio = document.getElementById('theme-light');
const themeDarkRadio = document.getElementById('theme-dark');
const defaultEditorInput = document.getElementById('default-editor');
const showHiddenFilesCheckbox = document.getElementById('show-hidden-files');
const transferModeSelect = document.getElementById('transfer-mode');

// Other Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');

// Buttons
const newConnectionBtn = document.getElementById('new-connection-btn');
const settingsBtn = document.getElementById('settings-btn');
const manageConnectionsBtn = document.getElementById('manage-connections-btn');
const addConnectionBtn = document.getElementById('add-connection-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const cancelConnectionBtn = document.getElementById('cancel-connection-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const selectEditorBtn = document.getElementById('select-editor-btn');

// Initialize
window.addEventListener('DOMContentLoaded', async() => {
    // Load settings
    await loadSettings();

    // Apply theme
    applyTheme(state.settings.theme);

    // Load connections
    await loadSavedConnections();
    await loadRecentConnections();

    // Set active view
    setActiveView('home');
});

// Load settings
async function loadSettings() {
    try {
        const settings = await window.ftpAPI.getSettings();
        state.settings = settings;

        // Update settings form
        themeLightRadio.checked = settings.theme === 'light';
        themeDarkRadio.checked = settings.theme === 'dark';
        defaultEditorInput.value = settings.defaultEditor || '';
        showHiddenFilesCheckbox.checked = settings.showHiddenFiles;
        transferModeSelect.value = settings.transferMode;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Apply theme
function applyTheme(theme) {
    if (theme === 'dark') {
        appContainer.classList.add('theme-dark');
    } else {
        appContainer.classList.remove('theme-dark');
    }
}

// Load saved connections
async function loadSavedConnections() {
    try {
        const connections = await window.ftpAPI.getSavedConnections();

        // Update saved connections in home view
        savedConnectionsContainer.innerHTML = '';

        if (connections.length === 0) {
            savedConnectionsContainer.innerHTML = '<p class="text-gray-500 text-center col-span-3">No saved connections</p>';
            return;
        }

        connections.forEach(conn => {
            const card = createConnectionCard(conn);
            savedConnectionsContainer.appendChild(card);
        });

        // Update connection list in manager view
        updateConnectionManagerList(connections, connectionSearch ? connectionSearch.value.trim() : '');

    } catch (error) {
        console.error('Error loading saved connections:', error);
    }
}



const connectionSearch = document.getElementById('connection-search');

// Add this new function
function filterConnections(connections, searchTerm) {
    if (!searchTerm) return connections;

    searchTerm = searchTerm.toLowerCase();
    return connections.filter(conn => {
        return (
            (conn.name && conn.name.toLowerCase().includes(searchTerm)) ||
            (conn.host && conn.host.toLowerCase().includes(searchTerm)) ||
            (conn.username && conn.username.toLowerCase().includes(searchTerm))
        );
    });
}


// Load recent connections
async function loadRecentConnections() {
    try {
        const connections = await window.ftpAPI.getRecentConnections();
        recentConnectionsContainer.innerHTML = '';

        if (connections.length === 0) {
            recentConnectionsContainer.innerHTML = '<p class="text-gray-500 text-center col-span-3">No recent connections</p>';
            return;
        }

        connections.forEach(conn => {
            const card = createConnectionCard(conn, true);
            recentConnectionsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading recent connections:', error);
    }
}

// Create connection card
function createConnectionCard(connection, isRecent = false) {
    const card = document.createElement('div');
    card.className = 'connection-card bg-white p-4 rounded-lg shadow relative';

    card.innerHTML = `
      <div class="flex justify-between">
        <h3 class="font-medium text-gray-900">${connection.name || `${connection.host}`}</h3>
        <div class="connection-actions absolute top-2 right-2 space-x-1">
          <button class="edit-connection-btn p-1 text-gray-600 hover:text-gray-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          ${!isRecent ? `
            <button class="delete-connection-btn p-1 text-red-600 hover:text-red-800" title="Delete">
              <i class="fas fa-trash-alt"></i>
            </button>
          ` : ''}
        </div>
      </div>
      <p class="text-sm text-gray-600 mt-1">${connection.host}${connection.username ? ` - ${connection.username}` : ''}</p>
      <button class="connect-btn mt-3 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
        Connect
      </button>
    `;
    
    // Connect button
    card.querySelector('.connect-btn').addEventListener('click', () => {
      connectToServer(connection);
    });
    
    // Edit button
    const editBtn = card.querySelector('.edit-connection-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editConnection(connection);
      });
    }
    
    // Delete button
    const deleteBtn = card.querySelector('.delete-connection-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirmDialog(`Are you sure you want to delete the connection "${connection.name || connection.host}"?`);
        if (confirmed) {
          await window.ftpAPI.deleteConnection(connection.id);
          await loadSavedConnections();
          await loadRecentConnections();
        }
      });
    }
    
    return card;
  }
  
  // Update connection manager list
  function updateConnectionManagerList(connections,searchTerm = '') {
    connectionList.innerHTML = '';
    
    if (connections.length === 0) {
      connectionList.innerHTML = '<p class="text-gray-500 text-center p-4">No saved connections</p>';
      return;
    }

    const filteredConnections = filterConnections(connections, searchTerm);
  
    connectionList.innerHTML = '';
    
    if (filteredConnections.length === 0) {
      if (searchTerm) {
        connectionList.innerHTML = `<p class="text-gray-500 text-center p-4">No connections match "${searchTerm}"</p>`;
      } else {
        connectionList.innerHTML = '<p class="text-gray-500 text-center p-4">No saved connections</p>';
      }
      return;
    }


    
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    thead.innerHTML = `
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security</th>
        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    `;
    
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    filteredConnections.forEach((conn, index) => {
      const row = document.createElement('tr');
      row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${conn.name || 'Unnamed'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${conn.host}:${conn.port}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${conn.username || 'Anonymous'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${conn.secure ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
            ${conn.secure ? 'FTPS' : 'FTP'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="connect-list-btn text-blue-600 hover:text-blue-900 mr-4">Connect</button>
          <button class="edit-list-btn text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
          <button class="delete-list-btn text-red-600 hover:text-red-900">Delete</button>
        </td>
      `;
      
      // Connect button
      row.querySelector('.connect-list-btn').addEventListener('click', () => {
        connectToServer(conn);
      });
      
      // Edit button
      row.querySelector('.edit-list-btn').addEventListener('click', () => {
        editConnection(conn);
      });
      
      // Delete button
      row.querySelector('.delete-list-btn').addEventListener('click', async () => {
        const confirmed = await showConfirmDialog(`Are you sure you want to delete the connection "${conn.name || conn.host}"?`);
        if (confirmed) {
          await window.ftpAPI.deleteConnection(conn.id);
          await loadSavedConnections();
        }
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    connectionList.appendChild(table);
  }

  // Add event listener for the search input
connectionSearch.addEventListener('input', async () => {
    const searchTerm = connectionSearch.value.trim();
    const connections = await window.ftpAPI.getSavedConnections();
    updateConnectionManagerList(connections, searchTerm);
  });


  
  // Edit connection
  function editConnection(connection) {
    // Switch to connection manager view
    setActiveView('connection-manager');
    
    // Show form
    connectionFormContainer.classList.remove('hidden');
    connectionFormTitle.textContent = 'Edit Connection';
    
    // Fill form
    connectionIdInput.value = connection.id || '';
    connectionNameInput.value = connection.name || '';
    connectionHostInput.value = connection.host || '';
    connectionPortInput.value = connection.port || '21';
    connectionUsernameInput.value = connection.username || '';
    connectionPasswordInput.value = connection.password || '';
    connectionSecureCheckbox.checked = connection.secure || false;
  }
  
  // Connect to server
  async function connectToServer(connectionInfo) {
    showLoading(`Connecting to ${connectionInfo.host}...`);
    
    try {
      const result = await window.ftpAPI.connect(connectionInfo);
      
      if (result.success) {
        // Create a new connection tab and view
        createConnectionTab(result.connectionId, connectionInfo);
        createConnectionView(result.connectionId, connectionInfo, result.currentDir);
        
        // Add connection to state
        state.connections.set(result.connectionId, {
          id: result.connectionId,
          info: connectionInfo,
          currentDir: result.currentDir
        });
        
        // Activate the new connection view
        setActiveView(result.connectionId);
        
        // Load the file list
        await refreshFileList(result.connectionId);
        
        // Initialize directory tree
        await initDirectoryTree(result.connectionId);
      } else {
        showNotification(`Connection failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification(`Connection error: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  }
  
  // Create connection tab
  function createConnectionTab(connectionId, connectionInfo) {
    const tabElement = document.createElement('div');
    tabElement.id = `tab-${connectionId}`;
    tabElement.className = 'connection-tab cursor-pointer';
    tabElement.dataset.connectionId = connectionId;
    
    tabElement.innerHTML = `
      <div class="truncate">${connectionInfo.name || connectionInfo.host}</div>
      <div class="connection-tab-close">
        <i class="fas fa-times"></i>
      </div>
    `;
    
    // Tab click handler
    tabElement.addEventListener('click', (e) => {
      if (!e.target.closest('.connection-tab-close')) {
        setActiveView(connectionId);
      }
    });
    
    // Close button handler
    tabElement.querySelector('.connection-tab-close').addEventListener('click', async (e) => {
      e.stopPropagation();
      await closeConnectionTab(connectionId);
    });
    
    // Insert before the add tab button
    connectionTabs.insertBefore(tabElement, addConnectionTab);
  }
  
  // Create connection view
  function createConnectionView(connectionId, connectionInfo, currentDir) {
    // Clone the template
    const view = connectionViewTemplate.cloneNode(true);
    view.id = `connection-${connectionId}`;
    view.classList.remove('hidden');
    view.dataset.connectionId = connectionId;
    
    // Set connection info
    view.querySelector('.connection-info').textContent = `${connectionInfo.host} (${connectionInfo.username || 'Anonymous'})`;
    view.querySelector('.current-path').textContent = currentDir;
    
    // Add event listeners
    initConnectionViewEvents(view, connectionId);
    
    // Add to the document
    homeView.parentNode.appendChild(view);
    
    // Initialize Split.js for the file browser and directory tree
    Split(view.querySelectorAll('.split-container > div'), {
      sizes: [25, 75],
      minSize: 200,
      gutterSize: 8,
      direction: 'horizontal'
    });
  }
  
  // Initialize connection view events
  function initConnectionViewEvents(view, connectionId) {
    // Disconnect button
    view.querySelector('.disconnect-btn').addEventListener('click', async () => {
      await closeConnectionTab(connectionId);
    });
    
    // Refresh button
    view.querySelector('.refresh-btn').addEventListener('click', async () => {
      await refreshFileList(connectionId);
    });
    
    // Go up button
    view.querySelector('.go-up-btn').addEventListener('click', async () => {
      await navigateUp(connectionId);
    });
    
    // Refresh tree button
    view.querySelector('.refresh-tree-btn').addEventListener('click', async () => {
      await initDirectoryTree(connectionId);
    });
    
    // Upload button
    view.querySelector('.upload-btn').addEventListener('click', async () => {
      await uploadFile(connectionId);
    });
    
    // Download button
    view.querySelector('.download-btn').addEventListener('click', async () => {
      await downloadFile(connectionId);
    });
    
    // Edit button
    view.querySelector('.edit-btn').addEventListener('click', async () => {
      await editFile(connectionId);
    });
    
    // Delete button
    view.querySelector('.delete-btn').addEventListener('click', async () => {
      await deleteItem(connectionId);
    });
    
    // New folder button
    view.querySelector('.mkdir-btn').addEventListener('click', async () => {
      await createDirectory(connectionId);
    });
    
    // Create file button
    view.querySelector('.create-file-btn').addEventListener('click', async () => {
      await createFile(connectionId);
    });
    
    // Add right-click context menu to file list container
    view.querySelector('.file-list-container').addEventListener('contextmenu', (e) => {
      // Only show if clicking directly on the container, not on a row
      if (e.target.closest('tr')) return;
      showContextMenu(e, connectionId, null);
    });
    
    // Add right-click context menu to directory tree container
    view.querySelector('.directory-tree').addEventListener('contextmenu', (e) => {
      // Only show if clicking directly on the container, not on an item
      if (e.target.closest('.directory-tree-item')) return;
      showContextMenu(e, connectionId, null);
    });
  }
  
  // Close connection tab
  async function closeConnectionTab(connectionId) {
    // Check if there are pending edits
    if (state.editedFiles.has(connectionId) && state.editedFiles.get(connectionId).length > 0) {
      const confirmed = await showConfirmDialog('You have edited files that haven\'t been saved back to the server. Save them now?');
      if (confirmed) {
        await saveAllEditedFiles(connectionId);
      }
    }
    
    try {
      // Disconnect from the server
      await window.ftpAPI.disconnect({ connectionId });
      
      // Remove the tab and view
      const tab = document.getElementById(`tab-${connectionId}`);
      const view = document.getElementById(`connection-${connectionId}`);
      
      if (tab) tab.remove();
      if (view) view.remove();
      
      // Remove from state
      state.connections.delete(connectionId);
      state.selectedItems.delete(connectionId);
      state.editedFiles.delete(connectionId);
      state.directoryCache.delete(connectionId);
      
      // If this was the active view, switch to home or another connection
      if (state.activeView === connectionId) {
        if (state.connections.size > 0) {
          // Switch to another connection
          const nextConnectionId = Array.from(state.connections.keys())[0];
          setActiveView(nextConnectionId);
        } else {
          // Switch to home
          setActiveView('home');
        }
      }
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
  
  // Set active view
  function setActiveView(viewId) {
    // Hide all views
    homeView.classList.add('hidden');
    connectionManagerView.classList.add('hidden');
    settingsView.classList.add('hidden');
    
    document.querySelectorAll('.connected-section').forEach(el => {
      el.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('#connection-tabs > div').forEach(el => {
      el.classList.remove('tab-active');
    });
    
    // Show selected view
    if (viewId === 'home') {
      homeView.classList.remove('hidden');
      homeTab.classList.add('tab-active');
    } else if (viewId === 'connection-manager') {
      connectionManagerView.classList.remove('hidden');
    } else if (viewId === 'settings') {
      settingsView.classList.remove('hidden');
    } else {
      // Show connection view
      const connectionView = document.getElementById(`connection-${viewId}`);
      if (connectionView) {
        connectionView.classList.remove('hidden');
        const tab = document.getElementById(`tab-${viewId}`);
        if (tab) tab.classList.add('tab-active');
      }
    }
    
    state.activeView = viewId;
  }
  
  // Initialize directory tree
  async function initDirectoryTree(connectionId) {
    const connection = state.connections.get(connectionId);
    if (!connection) return;
    
    const treeContainer = document.querySelector(`#connection-${connectionId} .directory-tree`);
    treeContainer.innerHTML = '<div class="text-center p-4">Loading...</div>';
    
    try {
      // Get current directory
      const currentDirResult = await window.ftpAPI.currentDirectory({ connectionId });
      if (!currentDirResult.success) {
        treeContainer.innerHTML = '<div class="text-center p-4 text-red-600">Failed to load directory structure</div>';
        return;
      }
      
      const rootDir = currentDirResult.path;
      connection.currentDir = rootDir;
      
      // Create root item
      treeContainer.innerHTML = '';
      const rootItem = document.createElement('div');
      rootItem.className = 'directory-tree-item';
      rootItem.dataset.path = '/';
      rootItem.innerHTML = `
        <div class="directory-tree-item-expand">
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="directory-tree-item-icon">
          <i class="fas fa-folder text-yellow-500"></i>
        </div>
        <div class="directory-tree-item-name truncate">Root</div>
      `;
      
      // Add click handler for root
      rootItem.addEventListener('click', async (e) => {
        if (!e.target.closest('.directory-tree-item-expand')) {
          // Navigate to root in the file browser
          await refreshFileList(connectionId, '/');
        }
      });
      
      // Add right-click handler
      rootItem.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
        showContextMenu(e, connectionId, rootItem);
      });
      
      // Add expand/collapse handler for root
      rootItem.querySelector('.directory-tree-item-expand').addEventListener('click', async (e) => {
        e.stopPropagation();
        const icon = rootItem.querySelector('.directory-tree-item-expand i');
        const isExpanded = icon.classList.contains('fa-chevron-down');
        
        if (isExpanded) {
          // Collapse
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          const childContainer = rootItem.nextElementSibling;
          if (childContainer && childContainer.classList.contains('directory-tree-children')) {
            childContainer.remove();
          }
        } else {
          // Expand
          await loadDirectoryContents(connectionId, '/', rootItem);
        }
      });
      
      treeContainer.appendChild(rootItem);
      
      // Initially expand root to show top-level directories
      await loadDirectoryContents(connectionId, '/', rootItem);
      
    } catch (error) {
      console.error('Error initializing directory tree:', error);
      treeContainer.innerHTML = '<div class="text-center p-4 text-red-600">Failed to load directory structure</div>';
    }
  }
  
  // Load directory contents for tree view
  async function loadDirectoryContents(connectionId, path, parentItem) {
    const expandIcon = parentItem.querySelector('.directory-tree-item-expand i');
    
    // Show loading indicator
    expandIcon.className = 'fas fa-spinner fa-spin';
    
    try {
      // Get directory listing
      const result = await window.ftpAPI.listDirectory({ connectionId, path });
      
      if (result.success) {
        expandIcon.classList.replace('fa-spinner', 'fa-chevron-down');
        
        // Remove existing child container if any
        const existingContainer = parentItem.nextElementSibling;
        if (existingContainer && existingContainer.classList.contains('directory-tree-children')) {
          existingContainer.remove();
        }
        
        // Create container for children
        const childContainer = document.createElement('div');
        childContainer.className = 'directory-tree-children ml-4';
        
        // Add directories to tree
        const directories = result.files.filter(file => file.type === 2); // Type 2 is directory
        
        // Filter out . and .. entries
        const filteredDirs = directories.filter(dir => dir.name !== '.' && dir.name !== '..');
        
        if (filteredDirs.length === 0) {
          expandIcon.className = 'fas fa-minus';
        } else {
          filteredDirs.forEach(dir => {
            const childPath = path === '/' ? `/${dir.name}` : `${path}/${dir.name}`;
            const childItem = document.createElement('div');
            childItem.className = 'directory-tree-item';
            childItem.dataset.path = childPath;
            
            childItem.innerHTML = `
              <div class="directory-tree-item-expand">
                <i class="fas fa-chevron-right"></i>
              </div>
              <div class="directory-tree-item-icon">
                <i class="fas fa-folder text-yellow-500"></i>
              </div>
              <div class="directory-tree-item-name truncate">${dir.name}</div>
            `;
            
            // Add click handler
            childItem.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!e.target.closest('.directory-tree-item-expand')) {
                // Navigate to this directory in the file browser
                await refreshFileList(connectionId, childPath);
              }
            });
            
            // Add right-click handler
            childItem.addEventListener('contextmenu', (e) => {
              e.stopPropagation();
              showContextMenu(e, connectionId, childItem);
            });
            
            // Add expand/collapse handler
            childItem.querySelector('.directory-tree-item-expand').addEventListener('click', async (e) => {
              e.stopPropagation();
              const icon = childItem.querySelector('.directory-tree-item-expand i');
              const isExpanded = icon.classList.contains('fa-chevron-down');
              
              if (isExpanded) {
                // Collapse
                icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
                const childContainer = childItem.nextElementSibling;
                if (childContainer && childContainer.classList.contains('directory-tree-children')) {
                  childContainer.remove();
                }
              } else {
                // Expand
                await loadDirectoryContents(connectionId, childPath, childItem);
              }
            });
            
            childContainer.appendChild(childItem);
          });
        }
        
        // Insert after the parent item
        parentItem.parentNode.insertBefore(childContainer, parentItem.nextSibling);
      } else {
        expandIcon.classList.replace('fa-spinner', 'fa-chevron-right');
        showNotification(`Failed to list directory: ${result.error}`, 'error', connectionId);
      }
    } catch (error) {
      expandIcon.classList.replace('fa-spinner', 'fa-chevron-right');
      console.error('Error loading directory contents:', error);
    }
  }
  
  // Refresh file list
  async function refreshFileList(connectionId, path) {
    const connection = state.connections.get(connectionId);
    if (!connection) return;
    
    const connectionView = document.getElementById(`connection-${connectionId}`);
    const fileList = connectionView.querySelector('.file-list');
    const currentPathElement = connectionView.querySelector('.current-path');
    const statusText = connectionView.querySelector('.status-text');
    const itemsCount = connectionView.querySelector('.items-count');
    
    statusText.textContent = 'Loading...';
    
    try {
      // Use specified path or get current directory
      if (!path) {
        const pwdResult = await window.ftpAPI.currentDirectory({ connectionId });
        if (pwdResult.success) {
          path = pwdResult.path;
          currentPathElement.textContent = path;
          connection.currentDir = path;
        } else {
          showNotification(`Failed to get current directory: ${pwdResult.error}`, 'error', connectionId);
          statusText.textContent = 'Error';
          return;
        }
      } else {
        // Change to the specified directory
        const cdResult = await window.ftpAPI.changeDirectory({ connectionId, path });
        if (cdResult.success) {
          currentPathElement.textContent = cdResult.path;
          connection.currentDir = cdResult.path;
        } else {
          showNotification(`Failed to change directory: ${cdResult.error}`, 'error', connectionId);
          statusText.textContent = 'Error';
          return;
        }
      }
      
      // Get file list
      const result = await window.ftpAPI.listDirectory({ connectionId, path: '.' });
      
      if (result.success) {
        renderFileList(connectionId, result.files);
        statusText.textContent = 'Ready';
        itemsCount.textContent = `${result.files.length} items`;
        
        // Cache the directory listing
        if (!state.directoryCache.has(connectionId)) {
          state.directoryCache.set(connectionId, new Map());
        }
        state.directoryCache.get(connectionId).set(connection.currentDir, result.files);
      } else {
        showNotification(`Failed to list files: ${result.error}`, 'error', connectionId);
        statusText.textContent = 'Error';
      }
    } catch (error) {
      console.error('Error refreshing file list:', error);
      showNotification(`Error: ${error.message}`, 'error', connectionId);
      statusText.textContent = 'Error';
    }
  }
  
  // Render file list
  function renderFileList(connectionId, files) {
    const connection = state.connections.get(connectionId);
    if (!connection) return;
    
    const connectionView = document.getElementById(`connection-${connectionId}`);
    const fileList = connectionView.querySelector('.file-list');
    fileList.innerHTML = '';
    
    // Settings for hidden files
    const showHidden = state.settings.showHiddenFiles;
    
    // Filter files if not showing hidden
    const filteredFiles = showHidden ? files : files.filter(file => !file.name.startsWith('.'));
    
    // Add parent directory unless at root
// Render file list (continued)
  // Add parent directory unless at root
  if (connection.currentDir !== '/') {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-100 cursor-pointer';
    row.innerHTML = `
      <td class="px-4 py-2 whitespace-nowrap">
        <div class="flex items-center">
          <div class="w-6 text-center">
            <i class="fas fa-level-up-alt text-gray-500"></i>
          </div>
          <span class="ml-2 text-sm text-gray-900">..</span>
        </div>
      </td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">-</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">-</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Directory</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">-</td>
    `;
    
    row.addEventListener('dblclick', async () => {
      await navigateUp(connectionId);
    });
    
    row.addEventListener('contextmenu', (e) => {
      showContextMenu(e, connectionId, null); // General context menu for directory area
    });
    
    fileList.appendChild(row);
  }
  
  // Sort files: directories first, then by name
  filteredFiles.sort((a, b) => {
    if (a.type === 2 && b.type !== 2) return -1;
    if (a.type !== 2 && b.type === 2) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Add files and directories
  filteredFiles.forEach(file => {
    // Skip . and .. entries
    if (file.name === '.' || file.name === '..') return;
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-100 cursor-pointer';
    row.dataset.name = file.name;
    row.dataset.isDirectory = file.type === 2;
    
    const isDirectory = file.type === 2; // FTP directory type
    const iconClass = isDirectory ? 'fa-folder text-yellow-500' : getFileIconClass(file.name);
    
    const size = isDirectory ? '-' : formatFileSize(file.size);
    const date = new Date(file.rawModifiedAt || Date.now()).toLocaleString();
    const type = isDirectory ? 'Directory' : getFileType(file.name);
    const permissions = file.permissions || '-';
    
    row.innerHTML = `
      <td class="px-4 py-2 whitespace-nowrap">
        <div class="flex items-center">
          <div class="w-6 text-center">
            <i class="fas ${iconClass}"></i>
          </div>
          <span class="ml-2 text-sm text-gray-900">${file.name}</span>
        </div>
      </td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${size}</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${date}</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${type}</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${permissions}</td>
    `;
    
    // Select file/directory on click
    row.addEventListener('click', (e) => {
      // Handle selection
      handleItemSelection(connectionId, row, e.ctrlKey || e.metaKey);
    });
    
    // Navigate into directory or download file on double click
    row.addEventListener('dblclick', async () => {
      if (isDirectory) {
        const currentDir = connection.currentDir;
        const newPath = currentDir === '/' ? `/${file.name}` : `${currentDir}/${file.name}`;
        await refreshFileList(connectionId, newPath);
      } else {
        // Download the file
        await downloadFile(connectionId, file.name);
      }
    });
    
    // Add right-click context menu
    row.addEventListener('contextmenu', (e) => {
      showContextMenu(e, connectionId, row);
    });
    
    fileList.appendChild(row);
  });
}

// Handle item selection
function handleItemSelection(connectionId, row, isMultiSelect) {
  const connectionView = document.getElementById(`connection-${connectionId}`);
  
  // Initialize selection set if needed
  if (!state.selectedItems.has(connectionId)) {
    state.selectedItems.set(connectionId, new Set());
  }
  
  const selectedItems = state.selectedItems.get(connectionId);
  
  if (!isMultiSelect) {
    // Single selection - clear previous selection
    connectionView.querySelectorAll('.file-list tr.bg-blue-50').forEach(tr => {
      tr.classList.remove('bg-blue-50');
    });
    selectedItems.clear();
  }
  
  // Toggle selection of this row
  if (row.classList.contains('bg-blue-50')) {
    row.classList.remove('bg-blue-50');
    selectedItems.delete(row.dataset.name);
  } else {
    row.classList.add('bg-blue-50');
    selectedItems.add(row.dataset.name);
  }
  
  // Update button states
  updateButtonStates(connectionId);
}

// Update button states based on selection
function updateButtonStates(connectionId) {
  const connectionView = document.getElementById(`connection-${connectionId}`);
  const downloadBtn = connectionView.querySelector('.download-btn');
  const editBtn = connectionView.querySelector('.edit-btn');
  const deleteBtn = connectionView.querySelector('.delete-btn');
  
  // Get selected items
  const selectedItems = state.selectedItems.get(connectionId) || new Set();
  
  if (selectedItems.size > 0) {
    // Check if any directories are selected
    const hasDirectories = Array.from(connectionView.querySelectorAll('.file-list tr.bg-blue-50')).some(
      row => row.dataset.isDirectory === 'true'
    );
    
    // Enable/disable buttons based on selection
    if (selectedItems.size === 1 && !hasDirectories) {
      // Single file selected - enable download and edit
      downloadBtn.classList.remove('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
      downloadBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
      downloadBtn.disabled = false;
      
      editBtn.classList.remove('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
      editBtn.classList.add('bg-purple-600', 'text-white', 'hover:bg-purple-700');
      editBtn.disabled = false;
    } else {
      // Multiple items or directory selected - disable edit, download depends on selection
      editBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
      editBtn.classList.remove('bg-purple-600', 'text-white', 'hover:bg-purple-700');
      editBtn.disabled = true;
      
      if (selectedItems.size === 1) {
        // Single directory - disable download
        downloadBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
        downloadBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
        downloadBtn.disabled = true;
      } else if (hasDirectories) {
        // Multiple with directories - disable download
        downloadBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
        downloadBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
        downloadBtn.disabled = true;
      } else {
        // Multiple files - enable download
        downloadBtn.classList.remove('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
        downloadBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
        downloadBtn.disabled = false;
      }
    }
    
    // Always enable delete when items are selected
    deleteBtn.classList.remove('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
    deleteBtn.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700');
    deleteBtn.disabled = false;
  } else {
    // No selection - disable all item-specific actions
    downloadBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
    downloadBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
    downloadBtn.disabled = true;
    
    editBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
    editBtn.classList.remove('bg-purple-600', 'text-white', 'hover:bg-purple-700');
    editBtn.disabled = true;
    
    deleteBtn.classList.add('bg-gray-400', 'text-gray-200', 'cursor-not-allowed');
    deleteBtn.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
    deleteBtn.disabled = true;
  }
}

// Navigate up one directory
async function navigateUp(connectionId) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  try {
    await refreshFileList(connectionId, '..');
  } catch (error) {
    console.error('Error navigating up:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Upload file
async function uploadFile(connectionId) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  showNotification('Selecting file to upload...', 'info', connectionId);
  
  try {
    const result = await window.ftpAPI.uploadFile({ connectionId });
    
    if (result.success) {
      showNotification('File uploaded successfully!', 'success', connectionId);
      await refreshFileList(connectionId);
    } else if (!result.canceled) {
      showNotification(`Upload failed: ${result.error}`, 'error', connectionId);
    } else {
      hideNotification(connectionId);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Download file
async function downloadFile(connectionId, fileName) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  // If fileName is not provided, get it from the selected item
  if (!fileName) {
    const selectedItems = state.selectedItems.get(connectionId);
    if (!selectedItems || selectedItems.size !== 1) return;
    
    fileName = Array.from(selectedItems)[0];
  }
  
  showNotification(`Downloading ${fileName}...`, 'info', connectionId);
  
  try {
    const result = await window.ftpAPI.downloadFile({
      connectionId,
      remotePath: fileName,
      fileName
    });
    
    if (result.success) {
      showNotification(`File downloaded successfully to ${result.filePath}!`, 'success', connectionId);
    } else if (!result.canceled) {
      showNotification(`Download failed: ${result.error}`, 'error', connectionId);
    } else {
      hideNotification(connectionId);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Edit file
async function editFile(connectionId, fileName) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  // If fileName is not provided, get it from the selected item
  if (!fileName) {
    const selectedItems = state.selectedItems.get(connectionId);
    if (!selectedItems || selectedItems.size !== 1) return;
    
    fileName = Array.from(selectedItems)[0];
  }
  
  showNotification(`Opening ${fileName} for editing...`, 'info', connectionId);
  
  try {
    const result = await window.ftpAPI.editFile({
      connectionId,
      remotePath: fileName,
      fileName
    });
    
    if (result.success) {
      // Add to edited files tracking
      if (!state.editedFiles.has(connectionId)) {
        state.editedFiles.set(connectionId, []);
      }
      state.editedFiles.get(connectionId).push(result.fileInfo);
      
      // Setup check for changes
      checkForFileChanges(connectionId, result.fileInfo);
      
      showNotification(`File opened in editor. Save changes in your editor to update the file.`, 'success', connectionId);
    } else {
      showNotification(`Failed to open file: ${result.error}`, 'error', connectionId);
    }
  } catch (error) {
    console.error('Error editing file:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Create empty file
async function createFile(connectionId) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  const fileName = await showInputDialog('Enter new file name:');
  if (!fileName) return;
  
  showNotification(`Creating file ${fileName}...`, 'info', connectionId);
  
  try {
    // Create a temporary empty file
    const tempFile = await window.ftpAPI.createTempFile();
    
    if (!tempFile.success) {
      showNotification(`Failed to create temporary file: ${tempFile.error}`, 'error', connectionId);
      return;
    }
    
    // Upload the empty file
    const result = await window.ftpAPI.uploadEmptyFile({
      connectionId,
      localPath: tempFile.path,
      remotePath: fileName
    });
    
    if (result.success) {
      showNotification(`File ${fileName} created!`, 'success', connectionId);
      await refreshFileList(connectionId);
      
      // Ask if user wants to edit the file
      const shouldEdit = await showConfirmDialog(`Do you want to edit ${fileName} now?`);
      if (shouldEdit) {
        // Get the file from the list
        const fileElement = Array.from(document.querySelectorAll(`#connection-${connectionId} .file-list tr`))
          .find(row => row.dataset.name === fileName);
          
        if (fileElement) {
          // Select the file and edit it
          handleItemSelection(connectionId, fileElement, false);
          await editFile(connectionId);
        }
      }
    } else {
      showNotification(`Create file failed: ${result.error}`, 'error', connectionId);
    }
  } catch (error) {
    console.error('Error creating file:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Function to check for file changes
function checkForFileChanges(connectionId, fileInfo) {
  // Set up an interval to check if the file has been modified
  const intervalId = setInterval(async () => {
    try {
      // Check if the connection still exists
      if (!state.connections.has(connectionId)) {
        clearInterval(intervalId);
        return;
      }
      
      // Check if the file exists and has been modified
      const result = await window.ftpAPI.saveEditedFile(fileInfo);
      
      if (result.success && result.uploaded) {
        showNotification(`Changes to ${fileInfo.fileName} saved back to server!`, 'success', connectionId);
        
        // Remove from edited files list
        if (state.editedFiles.has(connectionId)) {
          state.editedFiles.set(
            connectionId,
            state.editedFiles.get(connectionId).filter(f => f.localPath !== fileInfo.localPath)
          );
        }
        
        // Stop checking this file
        clearInterval(intervalId);
        
        // Refresh file list to show updated modification times
        await refreshFileList(connectionId);
      }
    } catch (error) {
      console.error('Error checking for file changes:', error);
    }
  }, 5000); // Check every 5 seconds
}

// Save all edited files for a connection
async function saveAllEditedFiles(connectionId) {
  if (!state.editedFiles.has(connectionId)) return;
  
  const editedFiles = state.editedFiles.get(connectionId);
  
  for (const fileInfo of editedFiles) {
    try {
      const result = await window.ftpAPI.saveEditedFile(fileInfo);
      if (result.success && result.uploaded) {
        showNotification(`Changes to ${fileInfo.fileName} saved back to server!`, 'success', connectionId);
      }
    } catch (error) {
      showNotification(`Failed to save ${fileInfo.fileName}: ${error.message}`, 'error', connectionId);
    }
  }
  
  // Clear the edited files list
  state.editedFiles.set(connectionId, []);
  
  // Refresh file list
  await refreshFileList(connectionId);
}

// Delete item
async function deleteItem(connectionId, fileName) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  let itemsInfo = [];
  
  // If fileName is provided, delete just that file
  if (fileName) {
    const row = Array.from(document.querySelectorAll(`#connection-${connectionId} .file-list tr`)).find(
      row => row.dataset.name === fileName
    );
    
    if (row) {
      itemsInfo.push({
        name: fileName,
        isDirectory: row.dataset.isDirectory === 'true'
      });
    } else {
      showNotification(`Item ${fileName} not found.`, 'error', connectionId);
      return;
    }
  } else {
    // Otherwise use selected items
    const selectedItems = state.selectedItems.get(connectionId);
    if (!selectedItems || selectedItems.size === 0) return;
    
    // Get confirmation
    const itemCount = selectedItems.size;
    const confirmMessage = itemCount === 1
      ? `Are you sure you want to delete ${Array.from(selectedItems)[0]}?`
      : `Are you sure you want to delete ${itemCount} items?`;
    
    const confirmed = await showConfirmDialog(confirmMessage);
    if (!confirmed) {
      return;
    }
    
    // Get isDirectory info for each selected item
    const connectionView = document.getElementById(`connection-${connectionId}`);
    itemsInfo = Array.from(selectedItems).map(name => {
      const row = Array.from(connectionView.querySelectorAll('.file-list tr')).find(
        row => row.dataset.name === name
      );
      return {
        name,
        isDirectory: row ? row.dataset.isDirectory === 'true' : false
      };
    });
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of itemsInfo) {
    showNotification(`Deleting ${item.name}...`, 'info', connectionId);
    
    try {
      const result = await window.ftpAPI.deleteItem({
        connectionId,
        path: item.name,
        isDirectory: item.isDirectory
      });
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        showNotification(`Failed to delete ${item.name}: ${result.error}`, 'error', connectionId);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error deleting ${item.name}:`, error);
      showNotification(`Error deleting ${item.name}: ${error.message}`, 'error', connectionId);
    }
  }
  
  // Show final status
  if (errorCount === 0) {
    showNotification(
      itemsInfo.length === 1
        ? `Item deleted successfully!`
        : `${successCount} items deleted successfully!`,
      'success',
      connectionId
    );
  } else if (successCount > 0) {
    showNotification(`Deleted ${successCount} items, ${errorCount} failed.`, 'warning', connectionId);
  }
  
  // Clear selection
  state.selectedItems.set(connectionId, new Set());
  
  // Refresh file list
  await refreshFileList(connectionId);
}

// Create directory
async function createDirectory(connectionId) {
  const connection = state.connections.get(connectionId);
  if (!connection) return;
  
  const dirName = await showInputDialog('Enter new folder name:');
  if (!dirName) return;
  
  showNotification(`Creating folder ${dirName}...`, 'info', connectionId);
  
  try {
    const result = await window.ftpAPI.createDirectory({
      connectionId,
      dirName
    });
    
    if (result.success) {
      showNotification(`Folder ${dirName} created!`, 'success', connectionId);
      await refreshFileList(connectionId);
    } else {
      showNotification(`Create folder failed: ${result.error}`, 'error', connectionId);
    }
  } catch (error) {
    console.error('Error creating directory:', error);
    showNotification(`Error: ${error.message}`, 'error', connectionId);
  }
}

// Create and show context menu
function showContextMenu(e, connectionId, target) {
  e.preventDefault();
  
  // Get the existing context menu or create a new one
  let contextMenu = document.getElementById('context-menu');
  const headerElement = contextMenu.querySelector('.context-menu-header');
  const itemsContainer = contextMenu.querySelector('.context-menu-items');
  
  // Clear previous items
  itemsContainer.innerHTML = '';
  
  // Set position
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Check what was clicked
  let isFile = false;
  let isDirectory = false;
  let itemName = '';
  let menuItems = [];
  
  if (target && target.dataset) {
    // File or directory in the file list
    if (target.dataset.name) {
      itemName = target.dataset.name;
      isDirectory = target.dataset.isDirectory === 'true';
      isFile = !isDirectory;
      
      if (headerElement) {
        headerElement.textContent = `${isDirectory ? 'Folder' : 'File'}: ${itemName}`;
      }
      
      // Add item-specific actions
      if (isFile) {
        menuItems.push(
          { label: 'Download', icon: 'fa-download', action: () => downloadFile(connectionId, itemName) },
          { label: 'Edit', icon: 'fa-edit', action: () => editFile(connectionId, itemName) },
          { label: 'Delete', icon: 'fa-trash-alt', action: () => deleteItem(connectionId, itemName) }
        );
      } else if (isDirectory) {
        menuItems.push(
          { label: 'Open', icon: 'fa-folder-open', action: async () => {
            const currentDir = state.connections.get(connectionId).currentDir;
            const newPath = currentDir === '/' ? `/${itemName}` : `${currentDir}/${itemName}`;
            await refreshFileList(connectionId, newPath);
          }},
          { label: 'Delete', icon: 'fa-trash-alt', action: () => deleteItem(connectionId, itemName) }
        );
      }
    } else if (target.classList.contains('directory-tree-item')) {
      // Directory in tree view
      const path = target.dataset.path;
      itemName = target.querySelector('.directory-tree-item-name').textContent;
      isDirectory = true;
      
      if (headerElement) {
        headerElement.textContent = `Folder: ${itemName}`;
      }
      
      menuItems.push(
        { label: 'Open', icon: 'fa-folder-open', action: async () => {
          await refreshFileList(connectionId, path);
        }},
        { label: 'New Folder', icon: 'fa-folder-plus', action: async () => {
          // First navigate to this directory
          await refreshFileList(connectionId, path);
          // Then create folder
          await createDirectory(connectionId);
        }},
        { label: 'New File', icon: 'fa-file-plus', action: async () => {
          // First navigate to this directory
          await refreshFileList(connectionId, path);
          // Then create file
          await createFile(connectionId);
        }}
      );
    } else {
      // Empty area in file list or directory tree
      if (headerElement) {
        headerElement.textContent = 'Actions';
      }
      
      menuItems.push(
        { label: 'Refresh', icon: 'fa-sync-alt', action: () => refreshFileList(connectionId) },
        { label: 'New Folder', icon: 'fa-folder-plus', action: () => createDirectory(connectionId) },
        { label: 'New File', icon: 'fa-file-plus', action: () => createFile(connectionId) },
        { label: 'Upload File', icon: 'fa-upload', action: () => uploadFile(connectionId) }
      );
    }
  }
  
  // Create menu items
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'py-2 px-4 hover:bg-gray-100 cursor-pointer flex items-center';
    menuItem.innerHTML = `
      <i class="fas ${item.icon} w-5 mr-2"></i>
      <span>${item.label}</span>
    `;
    menuItem.addEventListener('click', () => {
      contextMenu.classList.add('hidden');
      item.action();
    });
    itemsContainer.appendChild(menuItem);
  });
  
  // Show menu
  contextMenu.classList.remove('hidden');
  
  // Handle clicking outside to close
  const handleOutsideClick = (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.add('hidden');
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
}

// Show notification
function showNotification(message, type = 'info', connectionId = null) {
  let notification;
  
  if (connectionId) {
    // Connection-specific notification
    const connectionView = document.getElementById(`connection-${connectionId}`);
    if (!connectionView) {
      console.warn(`Connection view not found for ID: ${connectionId}`);
      // Fall back to global notification
      loadingOverlay.classList.remove('hidden');
      loadingMessage.textContent = message;
      setTimeout(hideLoading, 3000);
      return;
    }
    
    notification = connectionView.querySelector('.notification');
    if (!notification) {
      console.warn(`Notification element not found in connection view: ${connectionId}`);
      return;
    }
  } else {
    // Global notification - use loading overlay with message
    loadingOverlay.classList.remove('hidden');
    loadingMessage.textContent = message;
    setTimeout(hideLoading, 3000);
    return;
  }
  
  // Set notification style based on type
  let classes = 'p-2 text-center ';
  switch (type) {
    case 'success':
      classes += 'bg-green-100 text-green-800';
      break;
    case 'error':
      classes += 'bg-red-100 text-red-800';
      break;
    case 'warning':
      classes += 'bg-yellow-100 text-yellow-800';
      break;
    default:
      classes += 'bg-blue-100 text-blue-800';
  }
  
  notification.textContent = message;
  notification.className = classes;
  notification.classList.remove('hidden');
  
  // Auto-hide after a delay (except for errors)
  if (type !== 'error') {
    setTimeout(() => {
      hideNotification(connectionId);
    }, 5000);
  }
}

// Hide notification
function hideNotification(connectionId = null) {
  if (connectionId) {
    const connectionView = document.getElementById(`connection-${connectionId}`);
    if (!connectionView) return;
    
    const notification = connectionView.querySelector('.notification');
    if (!notification) return;
    
    notification.classList.add('hidden');
  } else {
    hideLoading();
  }
}

// Show loading overlay
function showLoading(message = 'Loading...') {
  loadingMessage.textContent = message;
  loadingOverlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// Custom dialog functions to replace prompt() and confirm()
function showInputDialog(title, defaultValue = '') {
  return new Promise((resolve) => {
    const dialog = document.getElementById('input-dialog');
    const titleElement = document.getElementById('input-dialog-title');
    const input = document.getElementById('input-dialog-value');
    const confirmBtn = document.getElementById('input-dialog-confirm');
    const cancelBtn = document.getElementById('input-dialog-cancel');
    
    titleElement.textContent = title;
    input.value = defaultValue;
    dialog.classList.remove('hidden');
    input.focus();
    
    const handleConfirm = () => {
      dialog.classList.add('hidden');
      resolve(input.value);
      cleanup();
    };
    
    const handleCancel = () => {
      dialog.classList.add('hidden');
      resolve(null);
      cleanup();
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      input.removeEventListener('keydown', handleKeyDown);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    input.addEventListener('keydown', handleKeyDown);
  });
}

function showConfirmDialog(message) {
    return new Promise((resolve) => {
      const dialog = document.getElementById('confirm-dialog');
      const messageElement = document.getElementById('confirm-dialog-message');
      const confirmBtn = document.getElementById('confirm-dialog-confirm');
      const cancelBtn = document.getElementById('confirm-dialog-cancel');
      
      messageElement.textContent = message;
      dialog.classList.remove('hidden');
      
      const handleConfirm = () => {
        dialog.classList.add('hidden');
        resolve(true);
        cleanup();
      };
      
      const handleCancel = () => {
        dialog.classList.add('hidden');
        resolve(false);
        cleanup();
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };
      
      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        document.removeEventListener('keydown', handleKeyDown);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      document.addEventListener('keydown', handleKeyDown);
    });
  }

  // Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Get file type based on extension
  function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const typeMap = {
      // Text files
      'txt': 'Text File',
      'md': 'Markdown',
      'html': 'HTML',
      'htm': 'HTML',
      'css': 'CSS',
      'js': 'JavaScript',
      'json': 'JSON',
      'xml': 'XML',
      
      // Code files
      'php': 'PHP',
      'py': 'Python',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'cs': 'C#',
      'rb': 'Ruby',
      'go': 'Go',
      'swift': 'Swift',
      'ts': 'TypeScript',
      
      // Image files
      'jpg': 'JPEG Image',
      'jpeg': 'JPEG Image',
      'png': 'PNG Image',
      'gif': 'GIF Image',
      'svg': 'SVG Image',
      'ico': 'Icon',
      'webp': 'WebP Image',
      
      // Document files
      'pdf': 'PDF Document',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'ppt': 'PowerPoint',
      'pptx': 'PowerPoint',
      
      // Archive files
      'zip': 'ZIP Archive',
      'rar': 'RAR Archive',
      'tar': 'TAR Archive',
      'gz': 'GZip Archive',
      '7z': '7-Zip Archive',
      
      // Audio/Video files
      'mp3': 'MP3 Audio',
      'wav': 'WAV Audio',
      'mp4': 'MP4 Video',
      'avi': 'AVI Video',
      'mov': 'QuickTime Video',
      'mkv': 'Matroska Video'
    };
    
    return typeMap[ext] || 'File';
  }
  
  // Get file icon class based on file extension
  function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const iconMap = {
      // Text files
      'txt': 'fa-file-alt text-gray-600',
      'md': 'fa-file-alt text-blue-600',
      'html': 'fa-file-code text-orange-600',
      'htm': 'fa-file-code text-orange-600',
      'css': 'fa-file-code text-blue-600',
      'js': 'fa-file-code text-yellow-600',
      'json': 'fa-file-code text-yellow-600',
      'xml': 'fa-file-code text-gray-600',
      
      // Code files
      'php': 'fa-file-code text-purple-600',
      'py': 'fa-file-code text-blue-600',
      'java': 'fa-file-code text-red-600',
      'c': 'fa-file-code text-blue-600',
      'cpp': 'fa-file-code text-blue-600',
      'cs': 'fa-file-code text-purple-600',
      'rb': 'fa-file-code text-red-600',
      'go': 'fa-file-code text-blue-600',
      'swift': 'fa-file-code text-orange-600',
      'ts': 'fa-file-code text-blue-600',
      
      // Image files
      'jpg': 'fa-file-image text-green-600',
      'jpeg': 'fa-file-image text-green-600',
      'png': 'fa-file-image text-green-600',
      'gif': 'fa-file-image text-green-600',
      'svg': 'fa-file-image text-green-600',
      'ico': 'fa-file-image text-green-600',
      'webp': 'fa-file-image text-green-600',
      
      // Document files
      'pdf': 'fa-file-pdf text-red-600',
      'doc': 'fa-file-word text-blue-600',
      'docx': 'fa-file-word text-blue-600',
      'xls': 'fa-file-excel text-green-600',
      'xlsx': 'fa-file-excel text-green-600',
      'ppt': 'fa-file-powerpoint text-red-600',
      'pptx': 'fa-file-powerpoint text-red-600',
      
      // Archive files
      'zip': 'fa-file-archive text-yellow-600',
      'rar': 'fa-file-archive text-yellow-600',
      'tar': 'fa-file-archive text-yellow-600',
      'gz': 'fa-file-archive text-yellow-600',
      '7z': 'fa-file-archive text-yellow-600',
      
      // Audio/Video files
      'mp3': 'fa-file-audio text-purple-600',
      'wav': 'fa-file-audio text-purple-600',
      'mp4': 'fa-file-video text-blue-600',
      'avi': 'fa-file-video text-blue-600',
      'mov': 'fa-file-video text-blue-600',
      'mkv': 'fa-file-video text-blue-600'
    };
    
    return iconMap[ext] || 'fa-file text-gray-600';
  }
  
  // Event listeners
  // Tab handlers
  homeTab.addEventListener('click', () => {
    setActiveView('home');
  });
  
  addConnectionTab.addEventListener('click', () => {
    newConnectionBtn.click();
  });
  
  // Button handlers
  newConnectionBtn.addEventListener('click', () => {
    setActiveView('connection-manager');
    connectionFormContainer.classList.remove('hidden');
    connectionFormTitle.textContent = 'Add New Connection';
    connectionForm.reset();
    connectionIdInput.value = '';
  });
  
  settingsBtn.addEventListener('click', () => {
    setActiveView('settings');
  });
  
  manageConnectionsBtn.addEventListener('click', () => {
    setActiveView('connection-manager');
    connectionFormContainer.classList.add('hidden');
  });
  
  addConnectionBtn.addEventListener('click', () => {
    connectionFormContainer.classList.remove('hidden');
    connectionFormTitle.textContent = 'Add New Connection';
    connectionForm.reset();
    connectionIdInput.value = '';
  });
  
  backToHomeBtn.addEventListener('click', () => {
    setActiveView('home');
  });
  
  cancelConnectionBtn.addEventListener('click', () => {
    connectionFormContainer.classList.add('hidden');
  });
  
  closeSettingsBtn.addEventListener('click', () => {
    setActiveView('home');
  });
  
  selectEditorBtn.addEventListener('click', async () => {
    try {
      const result = await window.ftpAPI.pickEditor();
      if (result.success) {
        defaultEditorInput.value = result.path;
      }
    } catch (error) {
      console.error('Error selecting editor:', error);
    }
  });
  
  // Form handlers
  quickConnectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const connectionInfo = {
      name: quickNameInput.value,
      host: quickHostInput.value,
      port: quickPortInput.value,
      username: quickUsernameInput.value,
      password: quickPasswordInput.value,
      secure: quickSecureCheckbox.checked,
      save: quickSaveConnectionCheckbox.checked
    };
    
    await connectToServer(connectionInfo);
  });
  
  connectionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const connection = {
      id: connectionIdInput.value || undefined,
      name: connectionNameInput.value,
      host: connectionHostInput.value,
      port: connectionPortInput.value,
      username: connectionUsernameInput.value,
      password: connectionPasswordInput.value,
      secure: connectionSecureCheckbox.checked
    };
    
    try {
      const result = await window.ftpAPI.saveConnection(connection);
      
      if (result.success) {
        connectionFormContainer.classList.add('hidden');
        await loadSavedConnections();
        await loadRecentConnections();
      }
    } catch (error) {
      console.error('Error saving connection:', error);
    }
  });
  
  settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const newSettings = {
      theme: themeLightRadio.checked ? 'light' : 'dark',
      defaultEditor: defaultEditorInput.value,
      showHiddenFiles: showHiddenFilesCheckbox.checked,
      transferMode: transferModeSelect.value
    };
    
    try {
      await window.ftpAPI.saveSettings(newSettings);
      state.settings = newSettings;
      applyTheme(newSettings.theme);
      
      showNotification('Settings saved successfully!', 'success');
      
      // Refresh file lists if settings affect display
      if (state.connections.size > 0) {
        for (const connectionId of state.connections.keys()) {
          await refreshFileList(connectionId);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  });
  
  // Close all connections before window closes
  window.addEventListener('beforeunload', async () => {
    await window.ftpAPI.disconnectAll();
  });