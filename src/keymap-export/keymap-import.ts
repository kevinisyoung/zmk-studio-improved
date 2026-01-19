/**
 * ZMK Keymap Import Utility
 *
 * Parses .keymap files and converts them to ZMK Studio internal representation
 * for importing configurations from zmk-config repositories.
 */

import type { Layer, BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { zmkKeycodeToHidUsage } from "./hid-to-zmk";

export type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

/**
 * ZMK behavior reference to behavior display name mapping (reverse of export)
 */
const ZMK_BEHAVIOR_TO_DISPLAY: Record<string, string> = {
  kp: "Key Press",
  trans: "Transparent",
  none: "None",
  mo: "Momentary Layer",
  tog: "Toggle Layer",
  to: "To Layer",
  sl: "Sticky Layer",
  sk: "Sticky Key",
  kt: "Key Toggle",
  mt: "Mod-Tap",
  lt: "Layer-Tap",
  gresc: "Grave/Escape",
  caps_word: "Caps Word",
  key_repeat: "Key Repeat",
  bootloader: "Bootloader",
  sys_reset: "Reset",
  studio_unlock: "Studio Unlock",
  soft_off: "Soft Off",
  ext_power: "External Power",
  out: "Output Selection",
  bt: "Bluetooth",
  bl: "Backlight",
  rgb_ug: "RGB Underglow",
};

export interface ParsedBinding {
  behavior: string;
  params: string[];
}

export interface ParsedLayer {
  name: string;
  displayName?: string;
  bindings: ParsedBinding[];
}

export interface ParsedKeymap {
  layers: ParsedLayer[];
  defines: Record<string, string>;
}

/**
 * Remove C-style comments from the content
 */
function removeComments(content: string): string {
  // Remove block comments /* ... */
  let result = content.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove line comments //
  result = result.replace(/\/\/.*$/gm, "");
  return result;
}

/**
 * Extract #define directives
 */
function extractDefines(content: string): Record<string, string> {
  const defines: Record<string, string> = {};
  const defineRegex = /#define\s+(\w+)\s+(\S+)/g;
  let match;

  while ((match = defineRegex.exec(content)) !== null) {
    defines[match[1]] = match[2];
  }

  return defines;
}

/**
 * Parse a binding string like "&kp A" or "&lt 1 SPACE"
 */
function parseBinding(bindingStr: string): ParsedBinding {
  const trimmed = bindingStr.trim();

  // Handle reference bindings like &kp, &mo, etc.
  if (trimmed.startsWith("&")) {
    const parts = trimmed.slice(1).split(/\s+/);
    const behavior = parts[0];
    const params = parts.slice(1);
    return { behavior, params };
  }

  // Unknown format
  return { behavior: "none", params: [] };
}

/**
 * Extract bindings from a bindings block
 */
function extractBindings(bindingsBlock: string): ParsedBinding[] {
  // Remove the outer < > and split by whitespace/newlines
  const content = bindingsBlock
    .replace(/^\s*<\s*/, "")
    .replace(/\s*>\s*;?\s*$/, "");

  const bindings: ParsedBinding[] = [];
  let currentBinding = "";
  let depth = 0;

  // Parse character by character to handle nested structures
  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === "&" && currentBinding.trim() === "") {
      // Start of a new binding
      if (depth === 0) {
        currentBinding = "&";
      } else {
        currentBinding += char;
      }
    } else if (char === "&" && depth === 0) {
      // New binding starts, save the current one
      if (currentBinding.trim()) {
        bindings.push(parseBinding(currentBinding.trim()));
      }
      currentBinding = "&";
    } else if (char === "(" || char === "<") {
      depth++;
      currentBinding += char;
    } else if (char === ")" || char === ">") {
      depth--;
      currentBinding += char;
    } else {
      currentBinding += char;
    }
  }

  // Don't forget the last binding
  if (currentBinding.trim()) {
    bindings.push(parseBinding(currentBinding.trim()));
  }

  return bindings;
}

/**
 * Extract layers from the keymap node
 */
function extractLayers(keymapContent: string): ParsedLayer[] {
  const layers: ParsedLayer[] = [];

  // Match layer definitions - looking for patterns like:
  // layer_name { ... bindings = < ... >; ... };
  const layerRegex = /(\w+)\s*\{([^}]*bindings\s*=\s*<[^>]*>[^}]*)\}/g;
  let match;

  while ((match = layerRegex.exec(keymapContent)) !== null) {
    const layerName = match[1];
    const layerContent = match[2];

    // Skip the keymap node itself
    if (layerName === "keymap") continue;

    // Extract display-name if present
    const displayNameMatch = layerContent.match(
      /display-name\s*=\s*"([^"]*)"/
    );
    const displayName = displayNameMatch ? displayNameMatch[1] : undefined;

    // Extract bindings
    const bindingsMatch = layerContent.match(/bindings\s*=\s*(<[^>]*>)/);
    if (bindingsMatch) {
      const bindings = extractBindings(bindingsMatch[1]);
      layers.push({
        name: layerName,
        displayName,
        bindings,
      });
    }
  }

  return layers;
}

/**
 * Parse a .keymap file content
 */
export function parseKeymapFile(content: string): ParsedKeymap {
  // Remove comments first
  const cleanContent = removeComments(content);

  // Extract defines
  const defines = extractDefines(cleanContent);

  // Find the keymap node content
  const keymapMatch = cleanContent.match(
    /keymap\s*\{[^}]*compatible\s*=\s*"zmk,keymap"\s*;([^]*?)\}\s*;/
  );

  let layers: ParsedLayer[] = [];
  if (keymapMatch) {
    layers = extractLayers(keymapMatch[0]);
  }

  return { layers, defines };
}

/**
 * Find behavior ID by display name
 */
function findBehaviorId(
  displayName: string,
  behaviors: BehaviorMap
): number | undefined {
  for (const [id, behavior] of Object.entries(behaviors)) {
    if (behavior.displayName === displayName) {
      return parseInt(id);
    }
  }
  return undefined;
}

/**
 * Convert a parsed binding to internal BehaviorBinding format
 */
function convertBinding(
  parsed: ParsedBinding,
  behaviors: BehaviorMap,
  defines: Record<string, string>
): BehaviorBinding | null {
  const displayName = ZMK_BEHAVIOR_TO_DISPLAY[parsed.behavior];
  if (!displayName) {
    console.warn(`Unknown behavior: ${parsed.behavior}`);
    return null;
  }

  const behaviorId = findBehaviorId(displayName, behaviors);
  if (behaviorId === undefined) {
    console.warn(
      `Could not find behavior ID for: ${displayName} (${parsed.behavior})`
    );
    return null;
  }

  let param1 = 0;
  let param2 = 0;

  // Resolve parameters using defines
  const resolveParam = (param: string): string => {
    // Check if it's a define reference
    if (defines[param]) {
      return defines[param];
    }
    return param;
  };

  switch (parsed.behavior) {
    case "kp":
    case "sk":
    case "kt": {
      // Single keycode parameter
      if (parsed.params.length > 0) {
        const keycode = resolveParam(parsed.params[0]);
        const hidUsage = zmkKeycodeToHidUsage(keycode);
        if (hidUsage !== undefined) {
          param1 = hidUsage;
        }
      }
      break;
    }

    case "mo":
    case "tog":
    case "to":
    case "sl": {
      // Single layer parameter
      if (parsed.params.length > 0) {
        const layerParam = resolveParam(parsed.params[0]);
        param1 = parseInt(layerParam) || 0;
      }
      break;
    }

    case "mt": {
      // Mod-Tap: modifier and keycode
      if (parsed.params.length >= 2) {
        const modifier = resolveParam(parsed.params[0]);
        const keycode = resolveParam(parsed.params[1]);
        const modHid = zmkKeycodeToHidUsage(modifier);
        const keyHid = zmkKeycodeToHidUsage(keycode);
        if (modHid !== undefined) param1 = modHid;
        if (keyHid !== undefined) param2 = keyHid;
      }
      break;
    }

    case "lt": {
      // Layer-Tap: layer and keycode
      if (parsed.params.length >= 2) {
        const layerParam = resolveParam(parsed.params[0]);
        const keycode = resolveParam(parsed.params[1]);
        param1 = parseInt(layerParam) || 0;
        const keyHid = zmkKeycodeToHidUsage(keycode);
        if (keyHid !== undefined) param2 = keyHid;
      }
      break;
    }

    case "ext_power": {
      // EP_ON, EP_OFF, EP_TOG
      if (parsed.params.length > 0) {
        const cmd = parsed.params[0];
        if (cmd === "EP_OFF") param1 = 0;
        else if (cmd === "EP_ON") param1 = 1;
        else if (cmd === "EP_TOG") param1 = 2;
      }
      break;
    }

    case "out": {
      // OUT_USB, OUT_BLE, OUT_TOG
      if (parsed.params.length > 0) {
        const out = parsed.params[0];
        if (out === "OUT_USB") param1 = 0;
        else if (out === "OUT_BLE") param1 = 1;
        else if (out === "OUT_TOG") param1 = 2;
      }
      break;
    }

    case "bt": {
      // BT_CLR, BT_SEL n
      if (parsed.params.length > 0) {
        const cmd = parsed.params[0];
        if (cmd === "BT_CLR") {
          param1 = 0;
        } else if (cmd === "BT_SEL" && parsed.params.length > 1) {
          param1 = parseInt(parsed.params[1]) + 1;
        }
      }
      break;
    }

    case "trans":
    case "none":
    case "gresc":
    case "caps_word":
    case "key_repeat":
    case "bootloader":
    case "sys_reset":
    case "studio_unlock":
    case "soft_off":
      // No parameters needed
      break;
  }

  return {
    behaviorId,
    param1,
    param2,
  };
}

/**
 * Convert parsed keymap to internal format
 */
export function convertParsedKeymap(
  parsed: ParsedKeymap,
  behaviors: BehaviorMap,
  defaultBindingCount: number
): Layer[] {
  return parsed.layers.map((parsedLayer, index) => {
    const bindings: BehaviorBinding[] = [];

    // Find the "None" behavior for padding
    const noneBehaviorId = findBehaviorId("None", behaviors) || 0;

    for (let i = 0; i < defaultBindingCount; i++) {
      if (i < parsedLayer.bindings.length) {
        const converted = convertBinding(
          parsedLayer.bindings[i],
          behaviors,
          parsed.defines
        );
        if (converted) {
          bindings.push(converted);
        } else {
          // Use "None" as fallback
          bindings.push({
            behaviorId: noneBehaviorId,
            param1: 0,
            param2: 0,
          });
        }
      } else {
        // Pad with "None" bindings
        bindings.push({
          behaviorId: noneBehaviorId,
          param1: 0,
          param2: 0,
        });
      }
    }

    return {
      id: index,
      name: parsedLayer.displayName || parsedLayer.name,
      bindings,
    };
  });
}

/**
 * Import keymap from file content
 */
export function importKeymap(
  content: string,
  behaviors: BehaviorMap,
  expectedBindingCount: number
): Layer[] {
  const parsed = parseKeymapFile(content);
  return convertParsedKeymap(parsed, behaviors, expectedBindingCount);
}

/**
 * Read a keymap file from user selection
 */
export async function readKeymapFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".keymap,.dts,.dtsi";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const content = await file.text();
        resolve(content);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * Import from clipboard
 */
export async function importFromClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch {
    return null;
  }
}

export interface ImportValidation {
  isValid: boolean;
  layerCount: number;
  bindingCounts: number[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate imported keymap content
 */
export function validateKeymapContent(
  content: string,
  expectedBindingCount?: number
): ImportValidation {
  const result: ImportValidation = {
    isValid: true,
    layerCount: 0,
    bindingCounts: [],
    warnings: [],
    errors: [],
  };

  try {
    const parsed = parseKeymapFile(content);
    result.layerCount = parsed.layers.length;

    if (result.layerCount === 0) {
      result.errors.push("No layers found in the keymap file");
      result.isValid = false;
      return result;
    }

    parsed.layers.forEach((layer, index) => {
      result.bindingCounts.push(layer.bindings.length);

      if (
        expectedBindingCount !== undefined &&
        layer.bindings.length !== expectedBindingCount
      ) {
        result.warnings.push(
          `Layer ${index} (${layer.name}) has ${layer.bindings.length} bindings, ` +
            `expected ${expectedBindingCount}`
        );
      }

      // Check for unknown behaviors
      layer.bindings.forEach((binding, bindingIndex) => {
        if (!ZMK_BEHAVIOR_TO_DISPLAY[binding.behavior]) {
          result.warnings.push(
            `Unknown behavior "&${binding.behavior}" at layer ${index}, position ${bindingIndex}`
          );
        }
      });
    });
  } catch (error) {
    result.errors.push(`Failed to parse keymap: ${error}`);
    result.isValid = false;
  }

  return result;
}
