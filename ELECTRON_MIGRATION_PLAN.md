# OpenCut Electron Migration Plan

## 🎯 Vision
Transform OpenCut from a web application to a fully local-first Electron desktop application with zero server dependencies.

## 📊 Current Architecture Analysis

### Current Stack
- **Frontend**: Next.js 15 with React 18
- **Database**: PostgreSQL (via Docker)
- **Cache/Rate Limiting**: Redis (via Docker)
- **Auth**: Better Auth with session management
- **API**: Next.js API Routes
- **External Services**:
  - Freesound API (sound library)
  - Cloudflare R2 (file storage for transcription)
  - Modal (transcription service)

### Current Database Schema
- `users` - User accounts
- `sessions` - Authentication sessions
- `accounts` - OAuth provider accounts
- `verifications` - Email verification tokens
- `export_waitlist` - Export feature waitlist

### Current API Routes
1. `/api/health` - Health check
2. `/api/auth/[...all]` - Authentication endpoints
3. `/api/sounds/search` - Sound library search (Freesound)
4. `/api/get-upload-url` - R2 upload URL generation
5. `/api/transcribe` - Audio transcription
6. `/api/waitlist/export` - Waitlist management

---

## 🏗️ Target Architecture

### New Stack
- **Frontend**: Next.js 15 (renderer process)
- **Backend**: Electron Main Process + tRPC
- **Database**: SQLite with Drizzle ORM (better-sqlite3)
- **Auth**: Local authentication (no cloud sessions)
- **IPC**: Electron IPC + tRPC for type-safe communication
- **File Storage**: Local filesystem
- **State Management**: Zustand (already in use)

### Benefits
✅ **Zero Setup** - No Docker, no databases to configure
✅ **Offline First** - Works without internet
✅ **Privacy** - All data stays local
✅ **Performance** - Direct file system access
✅ **Cross-Platform** - Windows, macOS, Linux
✅ **Type Safety** - End-to-end TypeScript with tRPC

---

## 📋 Migration Phases

## Phase 1: Foundation Setup (Week 1)

### 1.1 Project Structure
```
apps/
  electron/              # New Electron app
    main/               # Electron main process
      index.ts         # Main process entry
      trpc-server.ts   # tRPC server
      db/              # Database setup
        client.ts      # SQLite client
        migrations/    # Database migrations
    preload/           # Preload scripts
      index.ts
    renderer/          # Next.js app (existing web code)
      ... (existing src/)
  web/                 # Keep for web version (optional)
```

### 1.2 Dependencies to Add
```json
{
  "dependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "electron-store": "^10.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "better-sqlite3": "^11.0.0",
    "electron-trpc": "^0.6.0"
  }
}
```

### 1.3 Dependencies to Remove/Replace
- ❌ `pg` → ✅ `better-sqlite3`
- ❌ `@upstash/redis` → ✅ Local in-memory cache
- ❌ `@upstash/ratelimit` → ✅ Not needed (local app)
- ❌ `aws4fetch` → ✅ Local file system
- ❌ `better-auth` → ✅ Local auth system

---

## Phase 2: Database Migration (Week 1-2)

### 2.1 SQLite Schema Conversion
```typescript
// packages/db/src/schema.sqlite.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Local password
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  data: text('data').notNull(), // JSON blob
  thumbnail: text('thumbnail'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
```

### 2.2 Database Client Setup
```typescript
// apps/electron/main/db/client.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'opencut.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);
```

### 2.3 Migration Strategy
- Create SQLite equivalents for all tables
- Use Drizzle migrations for schema changes
- Store user data in app's userData directory
- Remove RLS (Row Level Security) - not needed locally

---

## Phase 3: tRPC Setup (Week 2)

### 3.1 tRPC Router Structure
```typescript
// apps/electron/main/trpc/root.ts
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { projectsRouter } from './routers/projects';
import { soundsRouter } from './routers/sounds';
import { transcriptionRouter } from './routers/transcription';

export const appRouter = router({
  auth: authRouter,
  projects: projectsRouter,
  sounds: soundsRouter,
  transcription: transcriptionRouter,
});

export type AppRouter = typeof appRouter;
```

### 3.2 Auth Router (Local)
```typescript
// apps/electron/main/trpc/routers/auth.ts
export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Hash password with bcrypt
      // Store in local SQLite
      // Return user
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Verify credentials
      // Create session
      // Return token
    }),

  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),
});
```

### 3.3 Projects Router
```typescript
// apps/electron/main/trpc/routers/projects.ts
export const projectsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query.projects.findMany({
        where: eq(projects.userId, ctx.userId),
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(projects).values({
        id: nanoid(),
        userId: ctx.userId,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.update(projects)
        .set(input)
        .where(eq(projects.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(projects)
        .where(eq(projects.id, input));
    }),
});
```

---

## Phase 4: Local Services Implementation (Week 3)

### 4.1 Local File Storage
```typescript
// apps/electron/main/services/file-storage.ts
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export class FileStorageService {
  private basePath: string;

  constructor() {
    this.basePath = path.join(app.getPath('userData'), 'media');
    this.ensureDirectory();
  }

  async saveMedia(file: Buffer, filename: string): Promise<string> {
    const filepath = path.join(this.basePath, filename);
    await fs.writeFile(filepath, file);
    return filepath;
  }

  async getMedia(filename: string): Promise<Buffer> {
    const filepath = path.join(this.basePath, filename);
    return await fs.readFile(filepath);
  }

  async deleteMedia(filename: string): Promise<void> {
    const filepath = path.join(this.basePath, filename);
    await fs.unlink(filepath);
  }
}
```

### 4.2 Local Sound Library
```typescript
// apps/electron/main/services/sound-library.ts
// Option 1: Bundle free sound effects with app
// Option 2: Download from Freesound on-demand (requires internet)
// Option 3: Allow users to import their own sounds

export class SoundLibraryService {
  private soundsPath: string;

  constructor() {
    this.soundsPath = path.join(app.getPath('userData'), 'sounds');
  }

  async searchLocal(query: string): Promise<Sound[]> {
    // Search locally stored sounds
    const files = await fs.readdir(this.soundsPath);
    return files.filter(f => f.includes(query.toLowerCase()));
  }

  async importSound(filepath: string): Promise<Sound> {
    // Copy user's sound to library
    const filename = path.basename(filepath);
    await fs.copyFile(filepath, path.join(this.soundsPath, filename));
    return { id: nanoid(), name: filename, path: filepath };
  }
}
```

### 4.3 Local Transcription (Optional)
```typescript
// apps/electron/main/services/transcription.ts
// Option 1: Use @xenova/transformers (Whisper in JS)
// Option 2: Call system whisper.cpp if installed
// Option 3: Disable transcription initially

import { pipeline } from '@xenova/transformers';

export class TranscriptionService {
  private transcriber: any;

  async initialize() {
    this.transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en'
    );
  }

  async transcribe(audioPath: string): Promise<Transcription> {
    const result = await this.transcriber(audioPath);
    return result;
  }
}
```

---

## Phase 5: Electron Integration (Week 3-4)

### 5.1 Main Process
```typescript
// apps/electron/main/index.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { createIPCHandler } from 'electron-trpc/main';
import { appRouter } from './trpc/root';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Next.js dev server
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from built files
    await mainWindow.loadFile(
      path.join(__dirname, '../renderer/out/index.html')
    );
  }

  // Setup tRPC IPC handler
  createIPCHandler({
    router: appRouter,
    windows: [mainWindow],
    createContext: async () => ({
      db,
      // Add user context from stored session
    }),
  });
}

app.whenReady().then(createWindow);
```

### 5.2 Preload Script
```typescript
// apps/electron/preload/index.ts
import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';

process.once('loaded', () => {
  exposeElectronTRPC();
});

contextBridge.exposeInMainWorld('electron', {
  // Add any additional electron APIs
});
```

### 5.3 Renderer (Frontend) Integration
```typescript
// apps/electron/renderer/lib/trpc.ts
import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { AppRouter } from '../../main/trpc/root';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

// Usage in React components
import { trpc } from '@/lib/trpc';

function ProjectsList() {
  const { data: projects } = trpc.projects.list.useQuery();

  return (
    <div>
      {projects?.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

---

## Phase 6: Migration & Testing (Week 4-5)

### 6.1 Component Updates
Replace all API fetch calls with tRPC calls:
```typescript
// Before (fetch)
const response = await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Project' }),
});

// After (tRPC)
const project = await trpc.projects.create.mutate({
  name: 'My Project'
});
```

### 6.2 State Management
Keep Zustand stores but update data fetching:
```typescript
// stores/projects-store.ts
import { create } from 'zustand';
import { trpc } from '@/lib/trpc';

export const useProjectsStore = create((set) => ({
  projects: [],
  fetchProjects: async () => {
    const projects = await trpc.projects.list.query();
    set({ projects });
  },
}));
```

### 6.3 Authentication Flow
```typescript
// pages/login.tsx
const handleLogin = async (email: string, password: string) => {
  try {
    const result = await trpc.auth.signIn.mutate({ email, password });
    // Store token in electron-store
    localStorage.setItem('token', result.token);
    router.push('/projects');
  } catch (error) {
    toast.error('Invalid credentials');
  }
};
```

### 6.4 Testing Checklist
- [ ] User registration and login
- [ ] Project CRUD operations
- [ ] File import/export
- [ ] Video editing features
- [ ] Sound library
- [ ] Settings persistence
- [ ] App updates mechanism
- [ ] Cross-platform compatibility (Win/Mac/Linux)

---

## Phase 7: Build & Distribution (Week 5-6)

### 7.1 Electron Builder Config
```json
// electron-builder.json
{
  "appId": "com.opencut.app",
  "productName": "OpenCut",
  "directories": {
    "output": "dist"
  },
  "files": [
    "main/**/*",
    "preload/**/*",
    "renderer/out/**/*"
  ],
  "mac": {
    "category": "public.app-category.video",
    "target": ["dmg", "zip"],
    "icon": "assets/icon.icns"
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "assets/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Video"
  }
}
```

### 7.2 Build Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"electron .\"",
    "build:renderer": "next build && next export",
    "build:main": "tsc -p tsconfig.main.json",
    "build": "npm run build:renderer && npm run build:main",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux"
  }
}
```

---

## 📦 Package Structure

```
opencut-electron/
├── apps/
│   └── electron/
│       ├── main/                    # Electron main process
│       │   ├── index.ts
│       │   ├── db/
│       │   │   ├── client.ts
│       │   │   └── schema.ts
│       │   ├── services/
│       │   │   ├── file-storage.ts
│       │   │   ├── sound-library.ts
│       │   │   └── transcription.ts
│       │   └── trpc/
│       │       ├── context.ts
│       │       ├── root.ts
│       │       └── routers/
│       │           ├── auth.ts
│       │           ├── projects.ts
│       │           └── sounds.ts
│       ├── preload/
│       │   └── index.ts
│       ├── renderer/                # Next.js app
│       │   └── ... (existing src/)
│       └── package.json
├── packages/
│   ├── db/                          # Shared database schema
│   │   └── src/
│   │       ├── schema.sqlite.ts
│   │       └── types.ts
│   └── shared/                      # Shared utilities
│       └── src/
│           └── types.ts
└── package.json
```

---

## 🔄 Data Migration from Web to Desktop

### For Existing Users
```typescript
// Migration utility
export async function importFromWebBackup(backupFile: string) {
  const data = JSON.parse(await fs.readFile(backupFile, 'utf-8'));

  // Migrate users
  for (const user of data.users) {
    await db.insert(users).values(user);
  }

  // Migrate projects
  for (const project of data.projects) {
    await db.insert(projects).values(project);
  }

  console.log('Migration complete!');
}
```

---

## ⚡ Performance Optimizations

1. **SQLite Optimizations**
   - Use WAL mode for better concurrent access
   - Create indexes on frequently queried columns
   - Use prepared statements

2. **File System Caching**
   - Cache thumbnails in memory
   - Lazy load project assets
   - Use streams for large files

3. **IPC Optimization**
   - Batch multiple requests
   - Use SharedArrayBuffer for large data
   - Implement request cancellation

---

## 🚀 Future Enhancements

1. **Cloud Sync (Optional)**
   - Add optional cloud backup
   - P2P collaboration with WebRTC
   - Plugin system for extensions

2. **AI Features (Local)**
   - Local AI video analysis
   - Smart editing suggestions
   - Auto-scene detection

3. **Advanced Export**
   - GPU-accelerated rendering
   - Multiple format support
   - Batch export queue

---

## 📋 Migration Checklist

### Foundation
- [ ] Create electron app structure
- [ ] Setup Electron + Next.js integration
- [ ] Configure electron-builder
- [ ] Setup tRPC server and client

### Database
- [ ] Convert schema to SQLite
- [ ] Setup Drizzle with better-sqlite3
- [ ] Create database migrations
- [ ] Implement database client

### Backend Services
- [ ] Implement auth router (local)
- [ ] Implement projects router
- [ ] Create file storage service
- [ ] Create sound library service
- [ ] Setup local transcription (optional)

### Frontend Migration
- [ ] Update all API calls to tRPC
- [ ] Remove Redis/rate-limiting code
- [ ] Update authentication flow
- [ ] Update file upload/download
- [ ] Test all existing features

### Testing
- [ ] Unit tests for tRPC routers
- [ ] Integration tests for IPC
- [ ] E2E tests for critical flows
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux

### Distribution
- [ ] Create installers for all platforms
- [ ] Setup auto-update mechanism
- [ ] Create release pipeline
- [ ] Write migration guide
- [ ] Update documentation

---

## 📚 Resources & References

### Documentation
- [Electron Official Docs](https://www.electronjs.org/docs)
- [tRPC with Electron](https://github.com/jsonnull/electron-trpc)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Drizzle ORM SQLite](https://orm.drizzle.team/docs/get-started-sqlite)

### Example Projects
- [VSCode](https://github.com/microsoft/vscode) - Electron + complex UI
- [Obsidian](https://obsidian.md/) - Local-first note-taking
- [Notion Desktop](https://www.notion.so/) - Offline-capable desktop app

### Tools
- [electron-builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [electron-updater](https://www.electron.build/auto-update)

---

## 🎯 Success Criteria

✅ Zero external dependencies (no Docker, no cloud services)
✅ Works completely offline
✅ Under 200MB installed size
✅ Cold start under 3 seconds
✅ All existing features working
✅ Cross-platform support (Win/Mac/Linux)
✅ Auto-update mechanism
✅ Data persists locally and securely

---

## ⏱️ Estimated Timeline

- **Week 1**: Foundation & Database Setup
- **Week 2**: tRPC Implementation
- **Week 3**: Local Services & Electron Integration
- **Week 4**: Frontend Migration & Testing
- **Week 5**: Build System & Distribution
- **Week 6**: Testing, Documentation & Release

**Total: 6 weeks for MVP**

---

## 💡 Alternative: Hybrid Approach

Keep web version AND create desktop version:
- Shared codebase for UI/logic
- Web version uses PostgreSQL + API routes
- Desktop version uses SQLite + tRPC
- Use feature flags to switch between modes

```typescript
const isElectron = typeof window !== 'undefined' && window.electron;

const api = isElectron
  ? trpc  // Use tRPC for desktop
  : fetch // Use API routes for web
```

This allows gradual migration and maintaining both platforms.

---

## 🎬 Getting Started

1. Review this plan with the team
2. Set up development environment
3. Create prototype with basic CRUD
4. Validate architecture decisions
5. Begin phased migration

Ready to start? Let's build the future of local-first video editing! 🚀




