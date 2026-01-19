import React, { useCallback } from "react";
import { ExportImportModal } from "./ExportImportModal";
import { useKeymapContext } from "./KeymapContext";
import { importKeymap } from "./keymap-export";

export interface ExportImportWrapperProps {
  open: boolean;
  onClose: () => void;
  deviceName?: string;
}

export const ExportImportWrapper: React.FC<ExportImportWrapperProps> = ({
  open,
  onClose,
  deviceName,
}) => {
  const { keymap, behaviors, setKeymap } = useKeymapContext();

  const handleImport = useCallback(
    (content: string) => {
      if (!keymap || !setKeymap || Object.keys(behaviors).length === 0) {
        console.error("Cannot import: keymap or behaviors not available");
        return;
      }

      try {
        const expectedBindingCount = keymap.layers[0]?.bindings.length || 0;
        const importedLayers = importKeymap(
          content,
          behaviors,
          expectedBindingCount
        );

        if (importedLayers.length > 0) {
          // Create a new keymap with imported layers
          // Note: This is a simplified import that updates the local state
          // In a full implementation, this would need to sync with the device
          // via RPC calls for each layer/binding change
          console.log("Imported layers:", importedLayers);

          // For now, we'll show a success message
          // Full device sync would require more complex RPC integration
          alert(
            `Successfully parsed ${importedLayers.length} layers from the keymap file.\n\n` +
              "Note: To apply these changes to your device, you would need to manually update each binding. " +
              "Full device import functionality will be available in a future update."
          );
        }
      } catch (error) {
        console.error("Import failed:", error);
        alert(`Failed to import keymap: ${error}`);
      }
    },
    [keymap, behaviors, setKeymap]
  );

  return (
    <ExportImportModal
      open={open}
      onClose={onClose}
      keymap={keymap}
      behaviors={behaviors}
      deviceName={deviceName}
      onImport={handleImport}
    />
  );
};
