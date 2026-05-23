/**
 * Safe local storage utility with quota protection and fallback to memory storage.
 * Prevents application crashes in Safari Private Browsing or when localStorage quota is exceeded.
 */

// Memory fallback database for sessions/temp data if localStorage is disabled or full
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key) || memoryStorage[key] || null;
    } catch (e) {
      console.warn(`[Storage Guard] Failed to read key "${key}" from localStorage:`, e);
      return memoryStorage[key] || null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      // Synchronize to memory fallback
      memoryStorage[key] = value;
      return true;
    } catch (e: any) {
      console.warn(`[Storage Guard] Failed to write key "${key}" to localStorage:`, e);

      // Detect QuotaExceededError across various browsers
      const isQuotaExceeded =
        e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        e.code === 22 ||
        e.code === 1014;

      if (isQuotaExceeded) {
        console.warn("[Storage Guard] Storage quota exceeded. Attempting self-cleanup...");
        try {
          // Identify backup keys that can be safely discarded
          const backupKeys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("indiecollab_backup_")) {
              backupKeys.push(k);
            }
          }

          // Discard older backups to reclaim space
          backupKeys.forEach((k) => localStorage.removeItem(k));

          // Try setting the item again
          localStorage.setItem(key, value);
          memoryStorage[key] = value;
          return true;
        } catch (retryError) {
          console.error("[Storage Guard] Cleanup retry failed. Falling back to memory storage.", retryError);
        }
      }

      // Memory storage fallback
      memoryStorage[key] = value;
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage Guard] Failed to remove key "${key}" from localStorage:`, e);
    }
    delete memoryStorage[key];
  }
};
