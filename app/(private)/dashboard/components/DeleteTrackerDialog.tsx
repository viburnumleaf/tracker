"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPermanentDelete: boolean;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteTrackerDialog({
  open,
  onOpenChange,
  isPermanentDelete,
  onConfirm,
  isLoading,
}: DeleteTrackerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPermanentDelete ? "Permanently Delete Tracker" : "Delete Tracker"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPermanentDelete
              ? "Are you sure you want to permanently delete this tracker? This will completely remove it from the database and all associated log entries. This action cannot be undone."
              : "Are you sure you want to delete this tracker? This will remove it from your list. This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading
              ? "Deleting..."
              : isPermanentDelete
              ? "Permanently Delete"
              : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
