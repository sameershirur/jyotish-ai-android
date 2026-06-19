import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo";

// Persists Clerk's session token in the OS keystore so a signed-in user
// stays signed in across app restarts (FR-11.3: sign-in required once per device).
export const secureTokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // SecureStore can fail on some devices/emulators without a keystore configured.
      // Falling through means the session just won't persist across restarts.
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // no-op
    }
  },
};
