import { useState, useCallback } from "react";

type UseDeleteConfirmationOptions<T> = {
  onConfirm: (item: T) => Promise<void>;
}

type UseDeleteConfirmationReturn<T> = {
  deleteConfirmOpen: boolean;
  itemToDelete: T | null;
  handleDeleteClick: (item: T) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
}

export const useDeleteConfirmation = <T,>({
  onConfirm,
}: UseDeleteConfirmationOptions<T>): UseDeleteConfirmationReturn<T> => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleDeleteClick = useCallback((item: T) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    await onConfirm(itemToDelete);
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, onConfirm]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, []);

  return {
    deleteConfirmOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}
