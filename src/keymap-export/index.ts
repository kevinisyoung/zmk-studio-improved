/**
 * ZMK Keymap Export/Import Module
 *
 * Provides functionality to export ZMK Studio configurations to .keymap files
 * and import .keymap files back into ZMK Studio for Git workflow integration.
 */

export {
  exportKeymap,
  downloadKeymap,
  copyKeymapToClipboard,
  type ExportOptions,
  type BehaviorMap,
} from "./keymap-export";

export {
  importKeymap,
  parseKeymapFile,
  readKeymapFile,
  importFromClipboard,
  validateKeymapContent,
  type ParsedKeymap,
  type ParsedLayer,
  type ParsedBinding,
  type ImportValidation,
} from "./keymap-import";

export {
  hidToZmkKeycode,
  hidUsageToZmkKeycode,
  zmkKeycodeToHid,
  zmkKeycodeToHidUsage,
} from "./hid-to-zmk";
