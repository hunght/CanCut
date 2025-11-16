import { BrowserWindow, Tray } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
// import { addWindowEventListeners } from "./window/window-listeners"; // Now handled by tRPC
import { addNotificationEventListeners } from "./notification/notification-listeners";
import { addBlockingNotificationEventListeners } from "./blocking-notification/blocking-notification-listeners";
import { addClockEventListeners } from "./clock/clock-listeners";
import { ipcMain, dialog } from "electron";

export default function registerListeners(_mainWindow: BrowserWindow, _tray: Tray | null): void {
  // Register listeners (window listeners now handled by tRPC)
  // addWindowEventListeners(mainWindow, tray); // Converted to tRPC
  addThemeEventListeners();
  addNotificationEventListeners();
  addBlockingNotificationEventListeners();
  addClockEventListeners();

  ipcMain.handle("select-media-files", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Media",
          extensions: ["mp4", "mov", "webm", "mp3", "wav", "ogg", "jpg", "jpeg", "png", "gif"],
        },
      ],
    });
    if (result.canceled) return [];
    return result.filePaths;
  });
}
