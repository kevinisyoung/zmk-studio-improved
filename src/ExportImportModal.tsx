import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "react-aria-components";
import {
  Download,
  Upload,
  Copy,
  ClipboardPaste,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { GenericModal } from "./GenericModal";
import { useModalRef } from "./misc/useModalRef";
import type { Keymap } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import {
  exportKeymap,
  downloadKeymap,
  copyKeymapToClipboard,
  readKeymapFile,
  importFromClipboard,
  validateKeymapContent,
  type BehaviorMap,
  type ImportValidation,
} from "./keymap-export";

export interface ExportImportModalProps {
  open: boolean;
  onClose: () => void;
  keymap: Keymap | null;
  behaviors: BehaviorMap;
  deviceName?: string;
  onImport?: (content: string) => void;
}

type TabType = "export" | "import";

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  open,
  onClose,
  keymap,
  behaviors,
  deviceName,
  onImport,
}) => {
  // All hooks must be called unconditionally at the top
  const modalRef = useModalRef(open, true);
  const [activeTab, setActiveTab] = useState<TabType>("export");
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [importContent, setImportContent] = useState("");
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate preview when export tab is active
  const generatePreview = useCallback(() => {
    if (keymap && Object.keys(behaviors).length > 0) {
      const content = exportKeymap(keymap, behaviors, {
        keyboardName: deviceName || "keyboard",
        includeComments: true,
        includeTimestamp: true,
      });
      setPreviewContent(content);
    }
  }, [keymap, behaviors, deviceName]);

  // Generate preview when tab changes to export
  useEffect(() => {
    if (activeTab === "export" && open) {
      generatePreview();
    }
  }, [activeTab, open, generatePreview]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!keymap) return;

    try {
      await copyKeymapToClipboard(keymap, behaviors, {
        keyboardName: deviceName || "keyboard",
        includeComments: true,
        includeTimestamp: true,
      });
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [keymap, behaviors, deviceName]);

  const handleDownload = useCallback(() => {
    if (!keymap) return;

    const filename = deviceName
      ? `${deviceName.toLowerCase().replace(/\s+/g, "_")}.keymap`
      : "keyboard.keymap";

    downloadKeymap(keymap, behaviors, filename, {
      keyboardName: deviceName || "keyboard",
      includeComments: true,
      includeTimestamp: true,
    });

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  }, [keymap, behaviors, deviceName]);

  const validateImportContent = useCallback(
    (content: string) => {
      const expectedBindings = keymap?.layers[0]?.bindings.length;
      const result = validateKeymapContent(content, expectedBindings);
      setValidation(result);
    },
    [keymap]
  );

  const handleFileSelect = useCallback(async () => {
    const content = await readKeymapFile();
    if (content) {
      setImportContent(content);
      validateImportContent(content);
    }
  }, [validateImportContent]);

  const handlePasteFromClipboard = useCallback(async () => {
    const content = await importFromClipboard();
    if (content) {
      setImportContent(content);
      validateImportContent(content);
    }
  }, [validateImportContent]);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const content = e.target.value;
      setImportContent(content);
      if (content.trim()) {
        validateImportContent(content);
      } else {
        setValidation(null);
      }
    },
    [validateImportContent]
  );

  const handleImport = useCallback(() => {
    if (onImport && validation?.isValid && importContent) {
      onImport(importContent);
      onClose();
    }
  }, [onImport, validation, importContent, onClose]);

  const handleClose = useCallback(() => {
    setImportContent("");
    setValidation(null);
    setPreviewContent("");
    setCopySuccess(false);
    setDownloadSuccess(false);
    onClose();
  }, [onClose]);

  // Don't render the modal at all when it's not open
  // This prevents any potential visibility issues with the dialog element
  if (!open) {
    return null;
  }

  return (
    <GenericModal
      ref={modalRef}
      onClose={handleClose}
      className="max-w-3xl w-full max-h-[80vh] flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Keymap Export / Import</h2>
        <Button
          className="p-1 hover:bg-base-200 rounded"
          onPress={handleClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-base-300 mb-4">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "export"
              ? "border-b-2 border-primary text-primary"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => setActiveTab("export")}
        >
          <Download className="w-4 h-4 inline-block mr-2" />
          Export
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "import"
              ? "border-b-2 border-primary text-primary"
              : "text-base-content/60 hover:text-base-content"
          }`}
          onClick={() => setActiveTab("import")}
        >
          <Upload className="w-4 h-4 inline-block mr-2" />
          Import
        </button>
      </div>

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="flex flex-col flex-1 min-h-0">
          <p className="text-sm text-base-content/70 mb-3">
            Export your keymap configuration to a .keymap file for use in your
            zmk-config Git repository.
          </p>

          {/* Preview */}
          <div className="flex-1 min-h-0 mb-4">
            <label className="block text-sm font-medium mb-1">Preview:</label>
            <textarea
              className="w-full h-64 p-3 bg-base-200 rounded font-mono text-xs overflow-auto resize-none"
              value={previewContent}
              readOnly
            />
          </div>

          {/* Export Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 rounded transition-colors"
              onPress={handleCopyToClipboard}
              isDisabled={!keymap}
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content hover:bg-primary/90 rounded transition-colors"
              onPress={handleDownload}
              isDisabled={!keymap}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download .keymap
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="flex flex-col flex-1 min-h-0">
          <p className="text-sm text-base-content/70 mb-3">
            Import a .keymap file from your zmk-config repository to apply it to
            your connected device.
          </p>

          {/* Import Sources */}
          <div className="flex gap-3 mb-4">
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 rounded transition-colors"
              onPress={handleFileSelect}
            >
              <FileText className="w-4 h-4" />
              Select File
            </Button>
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 rounded transition-colors"
              onPress={handlePasteFromClipboard}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste from Clipboard
            </Button>
          </div>

          {/* Import Content Area */}
          <div className="flex-1 min-h-0 mb-4">
            <label className="block text-sm font-medium mb-1">
              Keymap Content:
            </label>
            <textarea
              ref={textareaRef}
              className="w-full h-48 p-3 bg-base-200 rounded font-mono text-xs resize-none"
              value={importContent}
              onChange={handleTextareaChange}
              placeholder="Paste your .keymap file content here or use the buttons above..."
            />
          </div>

          {/* Validation Results */}
          {validation && (
            <div
              className={`p-3 rounded mb-4 ${
                validation.isValid
                  ? "bg-success/10 border border-success/30"
                  : "bg-error/10 border border-error/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {validation.isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">
                      Valid keymap file
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-error" />
                    <span className="font-medium text-error">
                      Invalid keymap file
                    </span>
                  </>
                )}
              </div>

              <div className="text-sm">
                <p>
                  Layers found: {validation.layerCount}
                  {validation.bindingCounts.length > 0 && (
                    <span className="text-base-content/60 ml-2">
                      ({validation.bindingCounts.join(", ")} bindings per layer)
                    </span>
                  )}
                </p>

                {validation.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-warning">Warnings:</p>
                    <ul className="list-disc list-inside text-base-content/70">
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-error">Errors:</p>
                    <ul className="list-disc list-inside text-base-content/70">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Action */}
          <div className="flex gap-3 justify-end">
            <Button
              className="px-4 py-2 bg-base-200 hover:bg-base-300 rounded transition-colors"
              onPress={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content hover:bg-primary/90 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onPress={handleImport}
              isDisabled={!validation?.isValid || !onImport}
            >
              <Upload className="w-4 h-4" />
              Import Keymap
            </Button>
          </div>

          {!onImport && (
            <p className="text-sm text-base-content/50 mt-2 text-center">
              Note: Import functionality requires an active device connection
              with an unlocked keymap.
            </p>
          )}
        </div>
      )}
    </GenericModal>
  );
};
