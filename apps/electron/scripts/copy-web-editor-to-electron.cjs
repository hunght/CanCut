#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFileSync(src, dest) {
  ensureDirSync(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirFiltered(srcDir, destDir, includes) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, includes);
    } else {
      if (!includes || includes.length === 0) {
        copyFileSync(srcPath, destPath);
      } else {
        if (includes.includes(entry.name)) {
          copyFileSync(srcPath, destPath);
        }
      }
    }
  }
}

function copyDirRecursiveOverwrite(srcDir, destDir) {
  ensureDirSync(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveOverwrite(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const webSrc = path.join(repoRoot, "apps/web/src");
  const electronSrc = path.join(repoRoot, "apps/electron/src");

  if (!fs.existsSync(webSrc)) {
    console.error(`Web src not found: ${webSrc}`);
    process.exit(1);
  }
  if (!fs.existsSync(electronSrc)) {
    console.error(`Electron src not found: ${electronSrc}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(webSrc, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "app") {
      console.log(`[skip] Skipping 'app' folder`);
      continue;
    }
    const srcPath = path.join(webSrc, entry.name);
    const destPath = path.join(electronSrc, entry.name);
    console.log(`[copy] ${srcPath} -> ${destPath}`);
    if (entry.isDirectory()) {
      copyDirRecursiveOverwrite(srcPath, destPath);
    } else {
      // top-level file
      copyFileSync(srcPath, destPath);
    }
  }

  console.log("Done. Review changes and run the app.");
}

main();


