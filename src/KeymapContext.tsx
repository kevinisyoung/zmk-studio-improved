import { createContext, useContext } from "react";
import type { Keymap } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";

export type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

export interface KeymapContextValue {
  keymap: Keymap | null;
  behaviors: BehaviorMap;
  setKeymap?: (keymap: Keymap) => void;
}

export const KeymapContext = createContext<KeymapContextValue>({
  keymap: null,
  behaviors: {},
});

export const useKeymapContext = () => useContext(KeymapContext);
