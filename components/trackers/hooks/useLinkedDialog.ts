import { useState, useCallback } from "react";

type UseLinkedDialogReturn<T> = {
  linkedDialogOpen: boolean;
  selectedItem: T | null;
  openLinkedDialog: (item: T) => void;
  closeLinkedDialog: () => void;
  handleOpenChange: (open: boolean) => void;
}

export const useLinkedDialog = <T,>(): UseLinkedDialogReturn<T> => {
  const [linkedDialogOpen, setLinkedDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openLinkedDialog = useCallback((item: T) => {
    setSelectedItem(item);
    setLinkedDialogOpen(true);
  }, []);

  const closeLinkedDialog = useCallback(() => {
    setLinkedDialogOpen(false);
    setSelectedItem(null);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setLinkedDialogOpen(open);
      if (!open) {
        setSelectedItem(null);
      }
    },
    []
  );

  return {
    linkedDialogOpen,
    selectedItem,
    openLinkedDialog,
    closeLinkedDialog,
    handleOpenChange,
  };
}
