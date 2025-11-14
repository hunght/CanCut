import { app } from "electron";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

export const getAppDefaultDownloadPath = (): string => {
  return path.join(app.getPath("userData"), "downloads");
};

export const ensureDownloadPathAccessible = async (targetPath: string): Promise<void> => {
  try {
    await fs.promises.mkdir(targetPath, { recursive: true });
    await fs.promises.access(targetPath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    logger.error("[downloads] Path not accessible", {
      targetPath,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

