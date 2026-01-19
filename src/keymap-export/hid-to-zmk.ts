/**
 * HID Usage to ZMK Keycode Mapping
 * Maps HID usage page and usage ID to ZMK keycode names
 */

// HID Usage Page 7 (Keyboard/Keypad)
const KEYBOARD_KEYCODES: Record<number, string> = {
  // Letters A-Z (4-29)
  4: "A",
  5: "B",
  6: "C",
  7: "D",
  8: "E",
  9: "F",
  10: "G",
  11: "H",
  12: "I",
  13: "J",
  14: "K",
  15: "L",
  16: "M",
  17: "N",
  18: "O",
  19: "P",
  20: "Q",
  21: "R",
  22: "S",
  23: "T",
  24: "U",
  25: "V",
  26: "W",
  27: "X",
  28: "Y",
  29: "Z",

  // Numbers 1-0 (30-39)
  30: "N1",
  31: "N2",
  32: "N3",
  33: "N4",
  34: "N5",
  35: "N6",
  36: "N7",
  37: "N8",
  38: "N9",
  39: "N0",

  // Control keys
  40: "RET", // Return/Enter
  41: "ESC", // Escape
  42: "BSPC", // Backspace
  43: "TAB", // Tab
  44: "SPACE", // Space
  45: "MINUS", // -
  46: "EQUAL", // =
  47: "LBKT", // [
  48: "RBKT", // ]
  49: "BSLH", // Backslash
  50: "NUHS", // Non-US Hash
  51: "SEMI", // ;
  52: "SQT", // '
  53: "GRAVE", // `
  54: "COMMA", // ,
  55: "DOT", // .
  56: "FSLH", // /
  57: "CAPS", // Caps Lock

  // Function keys F1-F12 (58-69)
  58: "F1",
  59: "F2",
  60: "F3",
  61: "F4",
  62: "F5",
  63: "F6",
  64: "F7",
  65: "F8",
  66: "F9",
  67: "F10",
  68: "F11",
  69: "F12",

  // Additional control keys
  70: "PSCRN", // Print Screen
  71: "SLCK", // Scroll Lock
  72: "PAUSE", // Pause
  73: "INS", // Insert
  74: "HOME", // Home
  75: "PG_UP", // Page Up
  76: "DEL", // Delete
  77: "END", // End
  78: "PG_DN", // Page Down
  79: "RIGHT", // Right Arrow
  80: "LEFT", // Left Arrow
  81: "DOWN", // Down Arrow
  82: "UP", // Up Arrow

  // Keypad
  83: "KP_NUM", // Num Lock
  84: "KP_DIVIDE", // Keypad /
  85: "KP_MULTIPLY", // Keypad *
  86: "KP_MINUS", // Keypad -
  87: "KP_PLUS", // Keypad +
  88: "KP_ENTER", // Keypad Enter
  89: "KP_N1", // Keypad 1
  90: "KP_N2", // Keypad 2
  91: "KP_N3", // Keypad 3
  92: "KP_N4", // Keypad 4
  93: "KP_N5", // Keypad 5
  94: "KP_N6", // Keypad 6
  95: "KP_N7", // Keypad 7
  96: "KP_N8", // Keypad 8
  97: "KP_N9", // Keypad 9
  98: "KP_N0", // Keypad 0
  99: "KP_DOT", // Keypad .

  // Additional keys
  100: "NUBS", // Non-US Backslash
  101: "K_APP", // Application (Context Menu)
  102: "K_PWR", // Power

  // Function keys F13-F24 (104-115)
  104: "F13",
  105: "F14",
  106: "F15",
  107: "F16",
  108: "F17",
  109: "F18",
  110: "F19",
  111: "F20",
  112: "F21",
  113: "F22",
  114: "F23",
  115: "F24",

  // Modifiers (224-231)
  224: "LCTRL", // Left Control
  225: "LSHFT", // Left Shift
  226: "LALT", // Left Alt
  227: "LGUI", // Left GUI (Windows/Command)
  228: "RCTRL", // Right Control
  229: "RSHFT", // Right Shift
  230: "RALT", // Right Alt (AltGr)
  231: "RGUI", // Right GUI
};

// HID Usage Page 12 (Consumer)
const CONSUMER_KEYCODES: Record<number, string> = {
  48: "C_POWER", // Power
  49: "C_RESET", // Reset
  50: "C_SLEEP", // Sleep
  102: "C_MENU", // Menu
  111: "C_BRI_UP", // Brightness Increment
  112: "C_BRI_DN", // Brightness Decrement
  176: "C_EJECT", // Eject
  181: "C_NEXT", // Scan Next Track
  182: "C_PREV", // Scan Previous Track
  183: "C_STOP", // Stop
  205: "C_PP", // Play/Pause
  226: "C_MUTE", // Mute
  233: "C_VOL_UP", // Volume Increment
  234: "C_VOL_DN", // Volume Decrement

  // Application Control
  545: "C_AC_SEARCH", // Search
  548: "C_AC_HOME", // Home
  549: "C_AC_BACK", // Back
  550: "C_AC_FORWARD", // Forward
  551: "C_AC_STOP", // Stop
  552: "C_AC_REFRESH", // Refresh
  553: "C_AC_BOOKMARKS", // Bookmarks
};

/**
 * Convert HID usage to ZMK keycode name
 * @param usagePage HID usage page (7 = Keyboard, 12 = Consumer)
 * @param usageId HID usage ID within the page
 * @returns ZMK keycode name or undefined if not found
 */
export function hidToZmkKeycode(
  usagePage: number,
  usageId: number
): string | undefined {
  if (usagePage === 7) {
    return KEYBOARD_KEYCODES[usageId];
  } else if (usagePage === 12) {
    return CONSUMER_KEYCODES[usageId];
  }
  return undefined;
}

/**
 * Convert combined HID usage value to ZMK keycode name
 * @param usage Combined HID usage value ((page << 16) | id)
 * @returns ZMK keycode name or undefined if not found
 */
export function hidUsageToZmkKeycode(usage: number): string | undefined {
  const page = (usage >> 16) & 0xffff;
  const id = usage & 0xffff;
  return hidToZmkKeycode(page, id);
}

// Reverse mapping for import
const ZMK_TO_HID: Record<string, { page: number; id: number }> = {};

// Build reverse mapping
Object.entries(KEYBOARD_KEYCODES).forEach(([id, name]) => {
  ZMK_TO_HID[name] = { page: 7, id: parseInt(id) };
});

Object.entries(CONSUMER_KEYCODES).forEach(([id, name]) => {
  ZMK_TO_HID[name] = { page: 12, id: parseInt(id) };
});

// Add common aliases
const ALIASES: Record<string, string> = {
  ENTER: "RET",
  RETURN: "RET",
  BACKSPACE: "BSPC",
  ESCAPE: "ESC",
  SPACE: "SPACE",
  SPC: "SPACE",
  DELETE: "DEL",
  INSERT: "INS",
  HOME: "HOME",
  END: "END",
  PAGE_UP: "PG_UP",
  PAGE_DOWN: "PG_DN",
  PGUP: "PG_UP",
  PGDN: "PG_DN",
  UP_ARROW: "UP",
  DOWN_ARROW: "DOWN",
  LEFT_ARROW: "LEFT",
  RIGHT_ARROW: "RIGHT",
  CAPSLOCK: "CAPS",
  CAPS_LOCK: "CAPS",
  LEFT_CONTROL: "LCTRL",
  RIGHT_CONTROL: "RCTRL",
  LEFT_SHIFT: "LSHFT",
  LSHIFT: "LSHFT",
  RIGHT_SHIFT: "RSHFT",
  RSHIFT: "RSHFT",
  LEFT_ALT: "LALT",
  RIGHT_ALT: "RALT",
  LEFT_GUI: "LGUI",
  RIGHT_GUI: "RGUI",
  LEFT_WIN: "LGUI",
  RIGHT_WIN: "RGUI",
  LEFT_META: "LGUI",
  RIGHT_META: "RGUI",
  LEFT_COMMAND: "LGUI",
  RIGHT_COMMAND: "RGUI",
  SEMICOLON: "SEMI",
  APOSTROPHE: "SQT",
  SINGLE_QUOTE: "SQT",
  BACKSLASH: "BSLH",
  SLASH: "FSLH",
  FORWARD_SLASH: "FSLH",
  LEFT_BRACKET: "LBKT",
  RIGHT_BRACKET: "RBKT",
  LBRC: "LBKT",
  RBRC: "RBKT",
  PLUS: "EQUAL", // Note: PLUS is Shift+EQUAL in most layouts
  UNDERSCORE: "MINUS", // Note: UNDERSCORE is Shift+MINUS
  NUMBER_1: "N1",
  NUMBER_2: "N2",
  NUMBER_3: "N3",
  NUMBER_4: "N4",
  NUMBER_5: "N5",
  NUMBER_6: "N6",
  NUMBER_7: "N7",
  NUMBER_8: "N8",
  NUMBER_9: "N9",
  NUMBER_0: "N0",
  // Volume controls
  C_VOLUME_UP: "C_VOL_UP",
  C_VOLUME_DOWN: "C_VOL_DN",
  C_PLAY_PAUSE: "C_PP",
  C_BRIGHTNESS_INC: "C_BRI_UP",
  C_BRIGHTNESS_DEC: "C_BRI_DN",
};

/**
 * Convert ZMK keycode name to HID usage
 * @param keycode ZMK keycode name
 * @returns HID usage object {page, id} or undefined if not found
 */
export function zmkKeycodeToHid(
  keycode: string
): { page: number; id: number } | undefined {
  const normalizedKeycode = keycode.toUpperCase();

  // Check direct mapping first
  if (ZMK_TO_HID[normalizedKeycode]) {
    return ZMK_TO_HID[normalizedKeycode];
  }

  // Check aliases
  const canonicalName = ALIASES[normalizedKeycode];
  if (canonicalName && ZMK_TO_HID[canonicalName]) {
    return ZMK_TO_HID[canonicalName];
  }

  return undefined;
}

/**
 * Convert ZMK keycode to combined HID usage value
 * @param keycode ZMK keycode name
 * @returns Combined HID usage value or undefined
 */
export function zmkKeycodeToHidUsage(keycode: string): number | undefined {
  const hid = zmkKeycodeToHid(keycode);
  if (hid) {
    return (hid.page << 16) | hid.id;
  }
  return undefined;
}
