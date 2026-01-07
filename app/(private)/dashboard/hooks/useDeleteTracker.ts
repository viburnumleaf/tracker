import { useState, useCallback } from "react";
import { useDeleteTracker, usePermanentlyDeleteTracker } from "@/src/features/trackers/hooks";
import { Tracker } from "@/src/api/trackers/trackers.api";

export const useDeleteTrackerDialog = () => {
  const deleteTrackerMutation = useDeleteTracker();
  const permanentlyDeleteTrackerMutation = usePermanentlyDeleteTracker();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<(Tracker & { isDeleted?: boolean }) | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  const openDeleteConfirm = useCallback((tracker: Tracker & { isDeleted?: boolean }) => {
    setTrackerToDelete(tracker);
    setIsPermanentDelete(tracker.isDeleted || false);
    setDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
    setTrackerToDelete(null);
    setIsPermanentDelete(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!trackerToDelete) return;

    try {
      if (isPermanentDelete) {
        await permanentlyDeleteTrackerMutation.mutateAsync(trackerToDelete._id);
      } else {
        await deleteTrackerMutation.mutateAsync(trackerToDelete._id);
      }
      closeDeleteConfirm();
    } catch (error) {
      console.error("Failed to delete tracker:", error);
    }
  }, [trackerToDelete, isPermanentDelete, deleteTrackerMutation, permanentlyDeleteTrackerMutation, closeDeleteConfirm]);

  return {
    deleteConfirmOpen,
    trackerToDelete,
    isPermanentDelete,
    isLoading: deleteTrackerMutation.isPending || permanentlyDeleteTrackerMutation.isPending,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
  };
}
