# DeskForge

<div align="center">

![DeskForge Logo](https://img.shields.io/badge/DeskForge-All--in--One%20Developer%20Workspace-7c3aed?style=for-the-badge&logo=electron&logoColor=white)

**One app. Every dev workflow.**

[![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

DeskForge is a cross-platform desktop application for developers that combines daily dev tools into a single workspace:

- 📝 **Markdown Notes** - Monaco Editor with live preview & autosave
- 🌐 **API Testing** - REST & GraphQL support with response formatting
- 🔐 **Secret Manager** - AES-256-GCM encrypted environment variables
- 🧩 **Code Snippets** - Searchable vault with syntax highlighting
- 🌳 **Git Viewer** - Branch, commits, and diff visualization

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗂️ Workspaces | Project-based organization |
| 📝 Markdown Editor | Monaco Editor with live preview |
| 🌐 API Tester | REST/GraphQL with response formatting |
| 🔐 Secrets | AES-256-GCM encrypted storage |
| 🧩 Snippets | Language-tagged, searchable code vault |
| 🌳 Git | Branch, history, and diff viewer |
| ⌘ Command Palette | Quick navigation (Ctrl+K) |
| 🌙 Themes | Dark/Light mode support |

## 🛠️ Tech Stack

- **Desktop**: Electron 28
- **Frontend**: React 18, TypeScript 5, Vite 5
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Editor**: Monaco Editor
- **Database**: SQLite (better-sqlite3)
- **Encryption**: AES-256-GCM with PBKDF2
- **Package Manager**: pnpm

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git (for Git viewer functionality)
- Python & C++ Build Tools (for native modules on Windows)

### Setup

```bash
# Clone the repository
git clone https://github.com/subhamkarande/deskforge.git
cd deskforge

# Install dependencies
pnpm install

# Rebuild native modules for Electron
npx @electron/rebuild -f -w better-sqlite3

# Create environment file
cp .env.example .env

# Generate an encryption key and add to .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Development

```bash
# Build main process first (required on first run)
pnpm --filter @deskforge/main build

# Start development mode
pnpm dev
```

### Build

```bash
# Build the application
pnpm build

# Create distribution packages
pnpm dist
```

## 🏗️ Project Structure

```
deskforge/
├── apps/
│   ├── main/                # Electron main process
│   │   └── src/
│   │       ├── main.ts      # Entry point
│   │       ├── preload.ts   # Context bridge
│   │       ├── lib/         # Database, encryption, git-utils
│   │       └── ipc/         # IPC handlers
│   └── renderer/            # React UI
│       └── src/
│           ├── components/  # UI components
│           ├── stores/      # Zustand stores
│           └── styles/      # Tailwind CSS
├── packages/                # Shared packages (reference)
├── electron-builder.json    # Build configuration
└── package.json
```

## 🔐 Security

- **Encryption**: Secrets are encrypted using AES-256-GCM with PBKDF2 key derivation
- **IPC Security**: Context isolation enabled, strict payload validation
- **No Telemetry**: Zero tracking or data collection
- **Local-First**: All data stored locally on your machine

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Open Command Palette |
| `Ctrl/⌘ + 1-5` | Switch modules |
| `Escape` | Close dialogs |

## 📋 Environment Variables

Create a `.env` file from `.env.example`:

```env
# Required: Encryption key for secrets (32-byte hex string)
ENCRYPTION_KEY=your-64-character-hex-key-here

# Optional: Application environment
APP_ENV=development
```

## 🚀 Distribution

DeskForge can be packaged for:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage`

```bash
# Build for current platform
pnpm dist

# Build for specific platform
pnpm dist --win
pnpm dist --mac
pnpm dist --linux
```

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Welcome Screen

The starting point to create or select a workspace.

### Notes Module  

Markdown editor with live preview powered by Monaco Editor.

### API Tester

REST and GraphQL testing with response formatting.

### Environment Manager

Encrypted secrets with .env import/export.

</details>

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/subhamkarande">Subham Karande</a>
</p>
