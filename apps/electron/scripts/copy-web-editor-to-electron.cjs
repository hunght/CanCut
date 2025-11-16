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

function main() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const mappings = [
    // Copy editor components
    {
      from: path.join(repoRoot, "apps/web/src/components/editor"),
      to: path.join(repoRoot, "apps/electron/src/components/editor"),
      includes: [],
    },
    // Hooks commonly used by editor
    {
      from: path.join(repoRoot, "apps/web/src/hooks"),
      to: path.join(repoRoot, "apps/electron/src/hooks"),
      includes: [
        "use-timeline-zoom.ts",
        "use-timeline-snapping.ts",
        "use-edge-auto-scroll.ts",
        "use-selection-box.ts",
        "use-highlight-scroll.ts",
        "use-frame-cache.ts",
      ],
    },
    // Constants
    {
      from: path.join(repoRoot, "apps/web/src/constants"),
      to: path.join(repoRoot, "apps/electron/src/constants"),
      includes: ["timeline-constants.ts", "text-constants.ts"],
    },
    // Types
    {
      from: path.join(repoRoot, "apps/web/src/types"),
      to: path.join(repoRoot, "apps/electron/src/types"),
      includes: ["timeline.ts", "media.ts"],
    },
    // Lib utilities used by editor
    {
      from: path.join(repoRoot, "apps/web/src/lib"),
      to: path.join(repoRoot, "apps/electron/src/lib"),
      includes: [
        "time.ts",
        "timeline-renderer.ts",
        "video-cache.ts",
        "media-processing.ts",
        "mediabunny-utils.ts",
      ],
    },
  ];

  for (const map of mappings) {
    if (!fs.existsSync(map.from)) {
      console.warn(`[skip] Missing source: ${map.from}`);
      continue;
    }
    console.log(`[copy] ${map.from} -> ${map.to}`);
    ensureDirSync(map.to);
    copyDirFiltered(map.from, map.to, map.includes);
  }

  console.log("Done. Review changes and run the app.");
}

main();


