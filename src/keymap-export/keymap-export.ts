/**
 * ZMK Keymap Export Utility
 *
 * Converts ZMK Studio internal keymap representation to .keymap file format
 * for use in zmk-config repositories and Git workflow integration.
 */

import type { Keymap, Layer, BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { hidUsageToZmkKeycode } from "./hid-to-zmk";

export type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

/**
 * Behavior display name to ZMK behavior reference mapping
 */
const BEHAVIOR_NAME_MAP: Record<string, string> = {
  "Key Press": "kp",
  "Transparent": "trans",
  "None": "none",
  "Momentary Layer": "mo",
  "Toggle Layer": "tog",
  "To Layer": "to",
  "Sticky Layer": "sl",
  "Sticky Key": "sk",
  "Key Toggle": "kt",
  "Mod-Tap": "mt",
  "Layer-Tap": "lt",
  "Grave/Escape": "gresc",
  "Caps Word": "caps_word",
  "Key Repeat": "key_repeat",
  "Bootloader": "bootloader",
  "Reset": "sys_reset",
  "Studio Unlock": "studio_unlock",
  "Soft Off": "soft_off",
  "External Power": "ext_power",
  "Output Selection": "out",
  "Bluetooth": "bt",
  "Backlight": "bl",
  "RGB Underglow": "rgb_ug",
};

/**
 * Convert a behavior binding to its ZMK .keymap string representation
 */
function bindingToString(
  binding: BehaviorBinding,
  behaviors: BehaviorMap,
  _layerNames: string[]
): string {
  const behavior = behaviors[binding.behaviorId];
  if (!behavior) {
    return "&none";
  }

  const behaviorName =
    BEHAVIOR_NAME_MAP[behavior.displayName] ||
    behavior.displayName.toLowerCase().replace(/\s+/g, "_");
  const behaviorRef = `&${behaviorName}`;

  // Handle different behavior types
  switch (behavior.displayName) {
    case "Transparent":
      return "&trans";

    case "None":
      return "&none";

    case "Key Press": {
      // param1 is the HID usage
      if (binding.param1) {
        const keycode = hidUsageToZmkKeycode(binding.param1);
        if (keycode) {
          return `&kp ${keycode}`;
        }
        // Fallback to hex representation
        return `&kp 0x${binding.param1.toString(16).toUpperCase()}`;
      }
      return "&none";
    }

    case "Momentary Layer":
    case "Toggle Layer":
    case "To Layer":
    case "Sticky Layer": {
      // param1 is the layer index
      const layerIndex = binding.param1 || 0;
      return `${behaviorRef} ${layerIndex}`;
    }

    case "Mod-Tap": {
      // param1 is modifier, param2 is keycode
      const modifier = binding.param1 ? hidUsageToZmkKeycode(binding.param1) : "LSHFT";
      const keycode = binding.param2 ? hidUsageToZmkKeycode(binding.param2) : "A";
      return `&mt ${modifier || "LSHFT"} ${keycode || "A"}`;
    }

    case "Layer-Tap": {
      // param1 is layer, param2 is keycode
      const layerIndex = binding.param1 || 0;
      const keycode = binding.param2 ? hidUsageToZmkKeycode(binding.param2) : "A";
      return `&lt ${layerIndex} ${keycode || "A"}`;
    }

    case "Sticky Key": {
      // param1 is the modifier key
      if (binding.param1) {
        const keycode = hidUsageToZmkKeycode(binding.param1);
        if (keycode) {
          return `&sk ${keycode}`;
        }
      }
      return `&sk LSHFT`;
    }

    case "Key Toggle": {
      // param1 is the key to toggle
      if (binding.param1) {
        const keycode = hidUsageToZmkKeycode(binding.param1);
        if (keycode) {
          return `&kt ${keycode}`;
        }
      }
      return `&kt CAPS`;
    }

    case "Grave/Escape":
      return "&gresc";

    case "Caps Word":
      return "&caps_word";

    case "Key Repeat":
      return "&key_repeat";

    case "Bootloader":
      return "&bootloader";

    case "Reset":
      return "&sys_reset";

    case "Studio Unlock":
      return "&studio_unlock";

    case "Soft Off":
      return "&soft_off";

    case "External Power": {
      // EP_ON, EP_OFF, EP_TOG
      const commands = ["EP_OFF", "EP_ON", "EP_TOG"];
      const cmd = commands[binding.param1 || 0] || "EP_TOG";
      return `&ext_power ${cmd}`;
    }

    case "Output Selection": {
      // OUT_USB, OUT_BLE, OUT_TOG
      const outputs = ["OUT_USB", "OUT_BLE", "OUT_TOG"];
      const out = outputs[binding.param1 || 0] || "OUT_TOG";
      return `&out ${out}`;
    }

    case "Bluetooth": {
      // BT_CLR, BT_SEL 0, etc.
      if (binding.param1 === 0) {
        return "&bt BT_CLR";
      } else if (binding.param1 !== undefined) {
        return `&bt BT_SEL ${binding.param1 - 1}`;
      }
      return "&bt BT_CLR";
    }

    default:
      // Generic handling for unknown behaviors
      if (binding.param1 && binding.param2) {
        return `${behaviorRef} ${binding.param1} ${binding.param2}`;
      } else if (binding.param1) {
        return `${behaviorRef} ${binding.param1}`;
      }
      return behaviorRef;
  }
}

/**
 * Generate layer name from index if not provided
 */
function getLayerName(layer: Layer, index: number): string {
  if (layer.name && layer.name.trim()) {
    // Sanitize the name to be a valid devicetree identifier
    return layer.name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^[0-9]/, "_$&")
      .replace(/_+/g, "_");
  }
  // Default layer names
  const defaultNames = [
    "default_layer",
    "lower_layer",
    "raise_layer",
    "adjust_layer",
    "nav_layer",
    "sym_layer",
    "num_layer",
    "fn_layer",
  ];
  return defaultNames[index] || `layer_${index}`;
}

/**
 * Get display name for layer
 */
function getLayerDisplayName(layer: Layer, index: number): string {
  if (layer.name && layer.name.trim()) {
    return layer.name;
  }
  const defaultDisplayNames = [
    "Default",
    "Lower",
    "Raise",
    "Adjust",
    "Nav",
    "Symbols",
    "Numbers",
    "Function",
  ];
  return defaultDisplayNames[index] || `Layer ${index}`;
}

/**
 * Format bindings in rows for readability
 * @param bindings Array of binding strings
 * @param keysPerRow Number of keys per row (for formatting)
 */
function formatBindings(bindings: string[], keysPerRow: number = 12): string {
  const rows: string[][] = [];
  for (let i = 0; i < bindings.length; i += keysPerRow) {
    rows.push(bindings.slice(i, i + keysPerRow));
  }

  const maxLen = Math.max(...bindings.map((b) => b.length));
  const padded = rows.map((row) =>
    row.map((b) => b.padEnd(maxLen + 1)).join(" ")
  );

  return padded.join("\n                ");
}

export interface ExportOptions {
  /** Include comments with layer info */
  includeComments?: boolean;
  /** Number of keys per row for formatting */
  keysPerRow?: number;
  /** Keyboard name for the file header */
  keyboardName?: string;
  /** Include timestamp in the header */
  includeTimestamp?: boolean;
}

/**
 * Export keymap to ZMK .keymap file format
 */
export function exportKeymap(
  keymap: Keymap,
  behaviors: BehaviorMap,
  options: ExportOptions = {}
): string {
  const {
    includeComments = true,
    keysPerRow = 12,
    keyboardName = "keyboard",
    includeTimestamp = true,
  } = options;

  const layerNames = keymap.layers.map((l, i) => getLayerName(l, i));
  const lines: string[] = [];

  // Header comment
  if (includeComments) {
    lines.push("/*");
    lines.push(` * ZMK Keymap - ${keyboardName}`);
    lines.push(" * Exported from ZMK Studio");
    if (includeTimestamp) {
      lines.push(` * Generated: ${new Date().toISOString()}`);
    }
    lines.push(" *");
    lines.push(
      " * This file can be used in your zmk-config repository."
    );
    lines.push(
      " * Place it in the config/ directory as <keyboard>.keymap"
    );
    lines.push(" */");
    lines.push("");
  }

  // Required includes
  lines.push("#include <behaviors.dtsi>");
  lines.push("#include <dt-bindings/zmk/keys.h>");
  lines.push("#include <dt-bindings/zmk/bt.h>");
  lines.push("#include <dt-bindings/zmk/outputs.h>");
  lines.push("#include <dt-bindings/zmk/ext_power.h>");
  lines.push("");

  // Layer defines for better readability
  if (includeComments) {
    lines.push("/* Layer Definitions */");
  }
  layerNames.forEach((name, index) => {
    lines.push(`#define ${name.toUpperCase()} ${index}`);
  });
  lines.push("");

  // Root node
  lines.push("/ {");

  // Keymap node
  lines.push('    keymap {');
  lines.push('        compatible = "zmk,keymap";');
  lines.push("");

  // Generate each layer
  keymap.layers.forEach((layer, index) => {
    const layerName = layerNames[index];
    const displayName = getLayerDisplayName(layer, index);

    if (includeComments) {
      lines.push(`        /* Layer ${index}: ${displayName} */`);
    }

    lines.push(`        ${layerName} {`);
    lines.push(`            display-name = "${displayName}";`);

    // Convert bindings
    const bindingStrings = layer.bindings.map((binding) =>
      bindingToString(binding, behaviors, layerNames)
    );

    lines.push("            bindings = <");
    lines.push(
      `                ${formatBindings(bindingStrings, keysPerRow)}`
    );
    lines.push("            >;");
    lines.push("        };");
    lines.push("");
  });

  lines.push("    };");
  lines.push("};");

  return lines.join("\n");
}

/**
 * Export keymap as a downloadable file
 */
export function downloadKeymap(
  keymap: Keymap,
  behaviors: BehaviorMap,
  filename: string = "keyboard.keymap",
  options: ExportOptions = {}
): void {
  const content = exportKeymap(keymap, behaviors, options);
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export keymap to clipboard
 */
export async function copyKeymapToClipboard(
  keymap: Keymap,
  behaviors: BehaviorMap,
  options: ExportOptions = {}
): Promise<void> {
  const content = exportKeymap(keymap, behaviors, options);
  await navigator.clipboard.writeText(content);
}
