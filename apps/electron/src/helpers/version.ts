import { trpcClient } from "@/utils/trpc";
import { logger } from "./logger";

/**
 * Gets the current application version using tRPC
 * @returns A promise that resolves to the current application version
 */
export async function getAppVersion(): Promise<string> {
  try {
    const result = await trpcClient.utils.getAppVersion.query();
    return result.version;
  } catch (error) {
    logger.error("Failed to get app version via tRPC", error);
  }

  // Fallbacks if tRPC fails or isn't available
  try {
    // Use import.meta.env when available (e.g., Vite)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (import.meta as any)?.env ?? {};
    if (typeof viteEnv.VITE_APP_VERSION === "string" && viteEnv.VITE_APP_VERSION.length > 0) {
      return viteEnv.VITE_APP_VERSION as string;
    }
  } catch {
    // ignore
  }

  // Guarded access to process.env to avoid ReferenceError in browser
  if (typeof process !== "undefined" && process?.env) {
    if (process.env.APP_VERSION) {
      return process.env.APP_VERSION;
    }
    if (process.env.npm_package_version) {
      return process.env.npm_package_version;
    }
  }

  return "unknown";
}
