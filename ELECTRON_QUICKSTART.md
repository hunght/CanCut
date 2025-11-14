# 🚀 Electron Migration Quick Start Guide

This guide will help you get started with the Electron migration in **under 30 minutes**.

## Step 1: Create Electron App Structure (5 min)

```bash
# From project root
mkdir -p apps/electron/{main,preload,renderer}
mkdir -p apps/electron/main/{db,services,trpc/routers}
```

## Step 2: Install Dependencies (5 min)

```bash
cd apps/electron
bun add -D electron electron-builder concurrently
bun add @trpc/server @trpc/client electron-trpc better-sqlite3 drizzle-orm
bun add bcrypt nanoid zod
bun add -D @types/better-sqlite3 @types/bcrypt
```

## Step 3: Create Basic Files (10 min)

### 3.1 Package.json
```json
{
  "name": "@opencut/electron",
  "version": "0.1.0",
  "main": "dist/main/index.js",
  "scripts": {
    "dev:renderer": "cd ../web && bun run dev",
    "dev:electron": "electron .",
    "dev": "concurrently \"bun run dev:renderer\" \"bun run dev:electron\"",
    "build:main": "tsc -p tsconfig.main.json",
    "build:renderer": "cd ../web && bun run build",
    "build": "bun run build:main && bun run build:renderer",
    "package": "electron-builder"
  }
}
```

### 3.2 Main Process Entry
```typescript
// apps/electron/main/index.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
    },
  });

  // Development: load from Next.js dev server
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load built files
    await mainWindow.loadFile('../renderer/out/index.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### 3.3 Preload Script
```typescript
// apps/electron/preload/index.ts
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
});
```

### 3.4 TypeScript Config
```json
// apps/electron/tsconfig.main.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/main",
    "module": "commonjs",
    "target": "es2022",
    "lib": ["es2022"]
  },
  "include": ["main/**/*", "preload/**/*"]
}
```

## Step 4: Test Basic Setup (5 min)

```bash
# Terminal 1: Start Next.js dev server
cd apps/web
bun run dev

# Terminal 2: Start Electron
cd apps/electron
bun run dev:electron
```

You should see the Electron window open with your Next.js app running inside! 🎉

## Step 5: Add SQLite Database (5 min)

```typescript
// apps/electron/main/db/client.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'opencut.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
```

```typescript
// apps/electron/main/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  data: text('data').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});
```

## Next Steps

1. ✅ Review the full migration plan: `ELECTRON_MIGRATION_PLAN.md`
2. 📝 Setup tRPC server (see Phase 3 in main plan)
3. 🔄 Migrate API routes to tRPC routers
4. 🎨 Update frontend to use tRPC
5. 📦 Build and package the app

## Useful Commands

```bash
# Development
bun run dev              # Start both renderer and electron

# Building
bun run build            # Build for production
bun run package          # Create distributable

# Platform-specific builds
bun run package:mac      # macOS
bun run package:win      # Windows
bun run package:linux    # Linux
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Electron Window                 │
│  ┌───────────────────────────────────┐  │
│  │   Next.js Frontend (Renderer)     │  │
│  │   - React Components              │  │
│  │   - tRPC Client                   │  │
│  │   - Zustand Stores                │  │
│  └───────────────────────────────────┘  │
│                  ↕ IPC                   │
│  ┌───────────────────────────────────┐  │
│  │   Electron Main Process           │  │
│  │   - tRPC Server                   │  │
│  │   - SQLite Database               │  │
│  │   - File System Access            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Tips

- 🔥 Hot reload works for renderer (Next.js) but not main process
- 🐛 Use `console.log` in main process - shows in terminal
- 🎨 Use DevTools in renderer - press `Cmd/Ctrl + Shift + I`
- 💾 Database location: `app.getPath('userData')/opencut.db`
- 📁 Media files: Store in `app.getPath('userData')/media/`

## Troubleshooting

**Electron window won't open?**
- Check if Next.js dev server is running on port 3000
- Look for errors in terminal

**TypeScript errors?**
- Run `bun install` in apps/electron
- Check tsconfig paths

**Database errors?**
- Check userData path with `console.log(app.getPath('userData'))`
- Ensure write permissions

Happy building! 🚀



