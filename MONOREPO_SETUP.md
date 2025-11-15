# OpenCut Monorepo Setup

This monorepo uses Bun as the package manager and Turbo for task orchestration.

## Prerequisites

- Bun 1.2.18 or later
- Node.js (for Electron)

## Installation

```bash
bun install
```

This will install all dependencies for all workspaces (apps and packages).

## Project Structure

```
OpenCut/
├── apps/
│   ├── electron/        # Electron desktop app (LearnifyTube)
│   ├── web/            # Next.js web app
│   └── transcription/  # Python transcription service
├── packages/
│   ├── auth/           # Shared authentication
│   └── db/             # Shared database utilities
```

## Running the Apps

### Electron App (LearnifyTube)

```bash
# From root directory
bun run dev:electron

# Or from the electron app directory
cd apps/electron
bun run dev
```

### Web App

```bash
# From root directory
bun run dev:web

# Or from the web app directory
cd apps/web
bun run dev
```

### Run all apps

```bash
bun run dev
```

## Building

```bash
# Build all apps
bun run build

# Build specific app
bun run build:electron
bun run build:web

# Package electron app
bun run package:electron

# Make electron distributables
bun run make:electron
```

## Database Commands (Electron App)

```bash
# From root directory
cd apps/electron

# Generate migrations
bun run db:generate

# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Database utilities
bun run db:backup
bun run db:health
bun run db:status
bun run db:counts
```

## Testing

```bash
# Test all apps
bun run test

# Test electron app only
bun run test:electron

# Or from electron directory
cd apps/electron
bun run test
bun run test:watch
bun run test:e2e
```

## Code Quality

```bash
# Type check all workspaces
bun run check-types

# Lint all workspaces
bun run lint

# Format all workspaces
bun run format
```

## Workspace Commands

Turbo will automatically handle dependencies between workspaces. When you run a command:

1. It will first run the command in all dependent workspaces
2. Then run it in the target workspace
3. Results are cached for faster subsequent runs

## Troubleshooting

### "Workspace not found in lockfile" warning

This is a benign warning from Turbo. Run `bun install` to update the lockfile.

### Electron rebuild issues

If you encounter native module issues:

```bash
cd apps/electron
bun run rebuild
```

### Clear build artifacts

```bash
cd apps/electron
bun run clean  # Removes .vite, dist, out
bun run clear  # Also removes node_modules
```

## Package Manager

This project uses **Bun** as the package manager. Do not use npm or yarn, as they are not compatible with the workspace protocol used in this monorepo.

All scripts have been updated to use `bun` or `bunx` instead of `npm` or `npx`.

## VSCode Integration

The project includes VSCode configuration files:

- `.vscode/settings.json` - Configures Bun as the package manager and disables auto-detection
- `.vscode/tasks.json` - Defines tasks for common operations using Bun

### Running Tasks in VSCode

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Tasks: Run Task"
3. Select from available tasks:
   - `dev:electron` - Run Electron app in dev mode (default build task)
   - `dev:web` - Run web app in dev mode
   - `build:electron` - Build Electron app
   - `build:web` - Build web app
   - `db:generate` - Generate database migrations
   - `db:push` - Push database schema
   - `db:studio` - Open Drizzle Studio
   - `test:electron` - Run Electron tests
   - `lint` - Lint all workspaces
   - `format` - Format all workspaces
   - `check-types` - Type check all workspaces

Or press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to run the default build task (`dev:electron`).
