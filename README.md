# Kites-FTP
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-donate-yellow)](https://buymeacoffee.com/kites)
Kites FTP Client  

A modern, cross-platform desktop FTP client with multi-connection support, built with Electron.


![Show Image](img/kites_ftp_.png)

## Features

- **Multiple Simultaneous Connections:** Connect to multiple FTP servers and switch between them with tabs
- **File Explorer Interface:** Explorer-like interface with directory tree and file listing
- **File Operations:** Upload, download, create, edit, and delete files and directories
- **Context Menus:** Right-click context menus for quick access to common operations
- **Custom Editor Support:** Use your preferred text editor for editing remote files
- **Dark Mode:** Toggle between light and dark themes
- **Connection Management:** Save, organize, and search your FTP connections
- **Cross-Platform:** Works on Windows, macOS



## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/kites-dev/Kites-FTP/releases) page.

### Build from Source

```bash
# Clone this repository
git clone https://github.com/kites-dev/Kites-FTP.git

# Navigate to the repository
cd Kites-FTP

# Install dependencies
npm install

# Run the app in development mode
npm start

# Build for your platform
npm run dist
```

## How to Use

### Quick Connect

1. Enter your FTP server details (host, port, username, password)
2. Click "Connect"
3. Browse and manage your files

### Connection Management

- Save connections for quick access
- Organize connections with custom names
- Search your saved connections

### File Operations

- **Browse:** Navigate through directories in the file browser or directory tree
- **Upload:** Click the Upload button or use the context menu
- **Download:** Select a file and click Download or use the context menu
- **Edit:** Open files in your preferred editor directly from the app
- **Create:** Create new files or folders via the toolbar or context menu
- **Delete:** Remove files or folders with the Delete button or context menu

### Multi-Connection Workflow

1. Connect to your first FTP server
2. Click "New Connection" to add another server
3. Switch between connections using the tabs
4. Drag and drop files between connections


### Keyboard Shortcuts

- `Ctrl+N` / `Cmd+N`: New Connection
- `Ctrl+W` / `Cmd+W`: Close Current Connection
- `Ctrl+Tab`: Next Connection
- `Ctrl+Shift+Tab`: Previous Connection
- `F5`: Refresh Current Directory
- `Delete`: Delete Selected Item(s)
- `Ctrl+Up` / `Cmd+Up`: Navigate to Parent Directory
- `Esc`: Cancel Current Operation

## Configuration

Settings can be accessed by clicking the settings icon in the top-right corner:

- **Theme:** Choose between Light and Dark themes
- **Default Editor:** Set your preferred text editor for remote files
- **Show Hidden Files:** Toggle visibility of hidden files and directories
- **Transfer Mode:** Select between Auto, Binary, and ASCII transfer modes

## Development

This application is built with:

- **Electron:** Cross-platform desktop apps with JavaScript
- **basic-ftp:** FTP client library
- **Split.js:** Resizable split views
- **TailwindCSS:** Utility-first CSS framework

## Project Structure

```plaintext
multi-ftp-client/
├── package.json         # Project configuration
├── main.js              # Electron main process
├── preload.js           # Preload script for secure context bridging
├── index.html           # Application UI
├── renderer.js          # UI logic
├── assets/              # Application assets
│   ├── icons/           # Application icons
│   └── css/             # Additional CSS styles
└── release-builds/      # Built applications
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Font Awesome** for the icons
- **Electron Packager** for application packaging
- All contributors who have helped improve this project

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/kites-dev/Kites-FTP/issues).

Made with ❤️ by [Kites.Dev](https://kites.dev) LLC