import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  selectMediaFiles: async (): Promise<string[]> => {
    return await ipcRenderer.invoke("select-media-files");
  },
});
