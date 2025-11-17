import { z } from "zod";
import { publicProcedure, t } from "@/api/trpc";
import { shell, net, app, dialog } from "electron";
import {
  createNotificationWindow,
  closeNotificationWindow as closeWindow,
} from "@/main/windows/notification";
import { sendNotificationToWindow } from "@/helpers/notification/notification-window-utils";

import { logger } from "@/helpers/logger";
import path from "path";
import fs from "fs";
import os from "os";

import { getDatabasePath } from "@/utils/paths";

import crypto from "crypto";

// Zod schemas for dictionary API response
const dictionaryDefinitionSchema = z.object({
  definition: z.string(),
  example: z.string().optional(),
});

const dictionaryMeaningSchema = z.object({
  partOfSpeech: z.string().optional(),
  definitions: z.array(dictionaryDefinitionSchema).optional(),
});

const dictionaryPhoneticSchema = z.object({
  text: z.string().optional(),
});

const dictionaryEntrySchema = z.object({
  meanings: z.array(dictionaryMeaningSchema).optional(),
  phonetic: z.string().optional(),
  phonetics: z.array(dictionaryPhoneticSchema).optional(),
});

const dictionaryResponseSchema = z.union([z.array(dictionaryEntrySchema), dictionaryEntrySchema]);

// Zod schema for Google Translate API response
// Actual response: [[["nhiễm trùng","infections",null,null,3,null,null,[[]],[[...]]]],null,"en",null,null,null,1,[],[...]]
// Structure:
// [0] translations: [["translated", "original", null, null, wordCount, null, null, [[]], metadata], ...]
// [1] null
// [2] detectedLanguage: "en"
// [3-5] null
// [6] confidence: 1
// [7] []
// [8] language metadata
const googleTranslateResponseSchema = z.tuple([
  z.array(z.array(z.unknown())), // translations - flexible to handle varying array lengths
  z.null(), // unused
  z.string(), // detected language (required)
  z.null().optional(),
  z.null().optional(),
  z.null().optional(),
  z.number().optional(), // confidence score
  z.array(z.unknown()).optional(),
  z.array(z.unknown()).optional(), // language metadata
]);

// Return types for utils router endpoints
type OpenExternalUrlResult = {
  success: boolean;
};

type ExplainWordSuccess = {
  success: true;
  word: string;
  explanation: string;
  pronunciation: string;
};

type ExplainWordFallback = {
  success: false;
  shouldOpenChatGPT: true;
  word: string;
  language: string;
};

type ExplainWordFailure = {
  success: false;
  message: string;
};

type ExplainWordResult = ExplainWordSuccess | ExplainWordFallback | ExplainWordFailure;

type TranslateTextSuccess = {
  success: true;
  translation: string; // The translated text
  translationId: string; // ID for saving to My Words
  originalText: string;
  sourceLang: string;
  targetLang: string;
  fromCache: boolean;
  queryCount?: number;
};

type TranslateTextFailure = {
  success: false;
  message: string;
};

type TranslateTextResult = TranslateTextSuccess | TranslateTextFailure;

type OpenLocalFileSuccess = { success: true };
type OpenLocalFileFailure = { success: false; error: string };
type OpenLocalFileResult = OpenLocalFileSuccess | OpenLocalFileFailure;

type OpenFolderSuccess = { success: true };
type OpenFolderFailure = { success: false; error: string };
type OpenFolderResult = OpenFolderSuccess | OpenFolderFailure;

type SelectFolderSuccess = { success: true; folderPath: string };
type SelectFolderCancelled = { success: false; cancelled: true };
type SelectFolderFailure = { success: false; cancelled: false; error: string };
type SelectFolderResult = SelectFolderSuccess | SelectFolderCancelled | SelectFolderFailure;

type QuitAppSuccess = { success: true };
type QuitAppFailure = { success: false; error: string };
type QuitAppResult = QuitAppSuccess | QuitAppFailure;

type GetAppVersionResult = { version: string };
type GetLogFileContentResult = string;
type ClearLogFileSuccess = { success: true };
type ClearLogFileFailure = { success: false; error: string };
type ClearLogFileResult = ClearLogFileSuccess | ClearLogFileFailure;

type DownloadUpdateSuccess = {
  status: "success";
  message: string;
  filePath: string;
  filename: string;
};

type DownloadUpdateFailure = {
  status: "error";
  message: string;
};

type DownloadUpdateResult = DownloadUpdateSuccess | DownloadUpdateFailure;

type CheckForUpdatesSuccess = {
  updateAvailable: true;
  latestVersion: string;
  currentVersion: string;
  downloadUrl: string;
  releaseNotes: string;
};

type CheckForUpdatesNoUpdate = {
  updateAvailable: false;
  latestVersion: string;
  currentVersion: string;
};

type CheckForUpdatesResult = CheckForUpdatesSuccess | CheckForUpdatesNoUpdate;

type SendNotificationSuccess = { success: true } | { success: boolean };
type SendNotificationFailure = { success: false; error: string };
type SendNotificationResult = SendNotificationSuccess | SendNotificationFailure;

type CloseNotificationWindowSuccess = { success: true };
type CloseNotificationWindowFailure = { success: false; error: string };
type CloseNotificationWindowResult =
  | CloseNotificationWindowSuccess
  | CloseNotificationWindowFailure;

type InstallUpdateSuccess = {
  status: "success";
  message: string;
  fallbackUrl: null;
  downloadUrl: null;
};

type InstallUpdateFailure = {
  status: "error";
  message: string;
};

type InstallUpdateResult = InstallUpdateSuccess | InstallUpdateFailure;

type GetDatabasePathResult = {
  path: string;
  directory: string;
  exists: boolean;
  size: number;
};

export const utilsRouter = t.router({
  openExternalUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }): Promise<OpenExternalUrlResult> => {
      await shell.openExternal(input.url);
      return { success: true };
    }),

  quitApp: publicProcedure.mutation(async (): Promise<QuitAppResult> => {
    try {
      logger.info("Quitting application...");
      app.quit();
      return { success: true };
    } catch (error) {
      logger.error("Failed to quit app:", error);
      return { success: false, error: String(error) };
    }
  }),

  // Get current app version
  getAppVersion: publicProcedure.query((): GetAppVersionResult => {
    return { version: app.getVersion() };
  }),

  // Get log file content
  getLogFileContent: publicProcedure.query(async (): Promise<GetLogFileContentResult> => {
    try {
      return await logger.getFileContent();
    } catch (error) {
      logger.error("Failed to get log file content", error);
      throw error;
    }
  }),

  // Clear log file content
  clearLogFile: publicProcedure.mutation(async (): Promise<ClearLogFileResult> => {
    try {
      await logger.clearLogFile();
      return { success: true } as const;
    } catch (error) {
      logger.error("Failed to clear log file", error);
      return { success: false, error: String(error) } as const;
    }
  }),

  openNotificationWindow: publicProcedure
    .input(
      z
        .object({
          title: z.string(),
          description: z.string(),
          autoDismiss: z.boolean().optional(), // Optional auto-dismiss setting
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      try {
        const window = await createNotificationWindow();

        // If data is provided, send it to the notification window
        if (input) {
          const success = await sendNotificationToWindow({
            title: input.title,
            body: input.description,
            autoDismiss: input.autoDismiss ?? false, // Default is false
          });
          return { success };
        }

        return { success: !!window };
      } catch (error) {
        logger.error("Failed to open notification window", error);
        return { success: false, error: String(error) };
      }
    }),

  // Version checking procedure
  checkForUpdates: publicProcedure.query(async (): Promise<CheckForUpdatesResult> => {
    return { updateAvailable: false, latestVersion: "1.0.001", currentVersion: "1.0.001" };
    // try {
    //   logger.info("Checking for updates...");
    //   const currentVersion = app.getVersion();
    //   logger.info(`Current app version: ${currentVersion}`);

    //   // Fetch the latest release from GitHub
    //   const response = await fetch(
    //     "https://api.github.com/repos/your-org/yt-dlp-gui/releases/latest"
    //   );

    //   if (!response.ok) {
    //     logger.error(`Failed to fetch latest release: ${response.statusText}`);
    //     return {
    //       status: "error" as const,
    //       message: "Failed to check for updates. Please try again later.",
    //       hasUpdate: false,
    //     };
    //   }

    //   const release = await response.json();
    //   const latestVersion = release.tag_name.replace("v", "");
    //   const downloadUrl = getPlatformDownloadUrl(latestVersion);

    //   logger.info(`Latest version available: ${latestVersion}`);

    //   // Compare versions (simple string comparison, assuming semver format)
    //   const hasUpdate = latestVersion > currentVersion;

    //   return {
    //     status: "success" as const,
    //     message: hasUpdate
    //       ? `Update available: ${latestVersion}`
    //       : "You are using the latest version.",
    //     hasUpdate,
    //     currentVersion,
    //     latestVersion,
    //     downloadUrl,
    //   };
    // } catch (error) {
    //   logger.error("Failed to check for updates", error);
    //   return {
    //     status: "error" as const,
    //     message: "Failed to check for updates. Please try again later.",
    //     hasUpdate: false,
    //   };
    // }
  }),

  // Download update procedure with progress tracking
  downloadUpdate: publicProcedure
    .input(
      z.object({
        downloadUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }): Promise<DownloadUpdateResult> => {
      const { downloadUrl } = input;

      try {
        logger.info("Starting download from:", downloadUrl);

        // Get the download directory
        const downloadsDir = path.join(os.homedir(), "Downloads");

        // Extract filename from URL
        const urlParts = downloadUrl.split("/");
        const filename = urlParts[urlParts.length - 1] || "CanCut-update.dmg";
        const filePath = path.join(downloadsDir, filename);

        // Ensure downloads directory exists
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }

        return new Promise<DownloadUpdateResult>((resolve, reject) => {
          // Helper to perform download and follow redirects up to maxRedirects
          const maxRedirects = 5;

          const doRequest = (urlToFetch: string, redirectsLeft: number): void => {
            let request;
            try {
              request = net.request({ method: "GET", url: urlToFetch });
            } catch (err) {
              logger.error("Failed to create net.request:", err);
              return reject({
                status: "error",
                message: `Failed to start download: ${String(err)}`,
              });
            }

            request.on("response", (response) => {
              const statusCode = response.statusCode || 0;
              logger.info(`Download response status: ${statusCode}`);

              // Handle redirects manually
              if (statusCode >= 300 && statusCode < 400 && redirectsLeft > 0) {
                const locationHeader = response.headers["location"] || response.headers["Location"];
                const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
                if (location) {
                  logger.info("Redirecting download to:", location);
                  // Drain response and start new request to location
                  response.on("data", () => {});
                  response.on("end", () => {
                    doRequest(location, redirectsLeft - 1);
                  });
                  return;
                }
              }

              if (statusCode >= 400) {
                logger.error(
                  "Download failed, status code:",
                  statusCode,
                  "headers:",
                  response.headers
                );
                // consume response and reject
                response.on("data", () => {});
                response.on("end", () => {
                  reject({ status: "error", message: `Download failed with status ${statusCode}` });
                });
                return;
              }

              logger.info(
                `Starting download, content-length: ${response.headers["content-length"] || "unknown"} bytes`
              );

              const writeStream = fs.createWriteStream(filePath);

              response.on("data", (chunk) => {
                writeStream.write(chunk);
              });

              response.on("end", () => {
                writeStream.end();
                logger.info("Download completed:", filePath);

                resolve({
                  status: "success",
                  message: "Download completed successfully",
                  filePath,
                  filename,
                });
              });

              response.on("error", (error) => {
                writeStream.destroy();
                logger.error("Download stream error:", error);
                reject({
                  status: "error",
                  message: "Download failed",
                });
              });
            });

            request.on("error", (error) => {
              logger.error("Download request error:", error);
              reject({
                status: "error",
                message: `Failed to start download: ${String(error)}`,
              });
            });

            request.end();
          };

          // Kick off the request
          doRequest(downloadUrl, maxRedirects);
        });
      } catch (error) {
        logger.error("Failed to download update", error);
        return {
          status: "error" as const,
          message: "Failed to download update",
        };
      }
    }),

  closeNotificationWindow: publicProcedure.mutation((): CloseNotificationWindowResult => {
    try {
      closeWindow();
      return { success: true };
    } catch (error) {
      logger.error("Failed to close notification window", error);
      return { success: false, error: String(error) };
    }
  }),
  // Check if update file already exists
  checkExistingUpdate: publicProcedure
    .input(
      z.object({
        version: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { version } = input;

      try {
        // Use a more reliable way to detect platform in main process
        const platform = process.platform;
        const arch = process.arch;
        const expectedFilename = `learnifytube-${platform}-${arch}-${version}.zip`;
        const downloadsDir = path.join(os.homedir(), "Downloads");
        const expectedPath = path.join(downloadsDir, expectedFilename);

        // Check if file exists
        if (fs.existsSync(expectedPath)) {
          logger.info("Found existing downloaded file:", expectedPath);
          return {
            exists: true,
            filePath: expectedPath,
          };
        }

        return {
          exists: false,
          filePath: null,
        };
      } catch (error) {
        logger.error("Error checking for existing file:", error);
        return {
          exists: false,
          filePath: null,
          error: String(error),
        };
      }
    }),
  // Direct notification send procedure (uses the new IPC channel)
  sendNotification: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        autoDismiss: z.boolean().optional(), // Optional auto-dismiss setting
      })
    )
    .mutation(async ({ input }): Promise<SendNotificationResult> => {
      try {
        const success = await sendNotificationToWindow({
          title: input.title,
          body: input.description,
          autoDismiss: input.autoDismiss ?? false, // Default is false
        });

        return { success };
      } catch (error) {
        logger.error("Failed to send notification", error);
        return { success: false, error: String(error) };
      }
    }),

  // Get database path
  getDatabasePath: publicProcedure.query((): GetDatabasePathResult => {
    const dbPath = getDatabasePath();
    // Remove 'file:' prefix to get actual file system path
    const actualPath = dbPath.replace(/^file:/, "");

    // Get absolute path
    const absolutePath = path.isAbsolute(actualPath)
      ? actualPath
      : path.resolve(process.cwd(), actualPath);

    return {
      path: absolutePath,
      directory: path.dirname(absolutePath),
      exists: fs.existsSync(absolutePath),
      size: fs.existsSync(absolutePath) ? fs.statSync(absolutePath).size : 0,
    };
  }),

  convertImageToDataUrl: publicProcedure
    .input(
      z.object({
        imagePath: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { imagePath } = input;

        // Check if file exists - this is expected behavior for lazy-loaded thumbnails
        // so we don't log it as a warning to reduce log noise
        if (!fs.existsSync(imagePath)) {
          return null;
        }

        // Read the file as a buffer
        const imageBuffer = fs.readFileSync(imagePath);

        // Get the file extension to determine MIME type
        const ext = path.extname(imagePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".gif": "image/gif",
          ".webp": "image/webp",
          ".bmp": "image/bmp",
        };

        const mimeType = mimeTypes[ext] || "image/jpeg";

        // Convert to base64 data URL
        const base64Image = imageBuffer.toString("base64");
        return `data:${mimeType};base64,${base64Image}`;
      } catch (error) {
        logger.error("Error converting image to data URL:", error);
        return null;
      }
    }),
});
