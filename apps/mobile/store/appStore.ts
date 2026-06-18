/**
 * store/appStore.ts
 * App-level settings (language, SOS state) managed with Zustand.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SupportedLocale = "en" | "hi" | "te" | "ta" | "kn";

interface AppState {
  language: SupportedLocale;
  sosActive: boolean;
  sosCountdown: number;
  allowRetraining: boolean;

  setLanguage: (lang: SupportedLocale) => Promise<void>;
  loadLanguage: () => Promise<void>;
  setSosActive: (active: boolean) => void;
  setSosCountdown: (n: number) => void;
  setAllowRetraining: (allow: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: "en",
  sosActive: false,
  sosCountdown: 10,
  allowRetraining: false,

  setLanguage: async (lang) => {
    await AsyncStorage.setItem("@nmc_language", lang);
    set({ language: lang });
  },

  loadLanguage: async () => {
    const stored = await AsyncStorage.getItem("@nmc_language");
    if (stored) {
      set({ language: stored as SupportedLocale });
    }
  },

  setSosActive: (active) => set({ sosActive: active, sosCountdown: 10 }),
  setSosCountdown: (n) => set({ sosCountdown: n }),
  setAllowRetraining: (allow) => set({ allowRetraining: allow }),
}));
