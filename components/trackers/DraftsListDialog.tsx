"use client";

import { useState } from "react";
import { useDrafts, useDeleteDraft } from "@/src/features/drafts/hooks";
import { useTrackers } from "@/src/features/trackers/hooks";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DraftEntry } from "@/src/api/drafts/drafts.api";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { Trash2, XIcon } from "lucide-react";
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
import { LogEntryDialog } from "./LogEntryDialog";

interface DraftsListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DraftsListDialog({
  open,
  onOpenChange,
}: DraftsListDialogProps) {
  const { drafts, isLoading } = useDrafts();
  const { trackers } = useTrackers(false);
  const deleteDraftMutation = useDeleteDraft();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<DraftEntry | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftEntry | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const handleDeleteClick = (draft: DraftEntry) => {
    setDraftToDelete(draft);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!draftToDelete) return;

    try {
      await deleteDraftMutation.mutateAsync(draftToDelete._id);
      setDeleteConfirmOpen(false);
      setDraftToDelete(null);
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const handleDraftClick = (draft: DraftEntry) => {
    setSelectedDraft(draft);
    setLogDialogOpen(true);
  };

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t._id === trackerId);
    return tracker ? tracker.name.replace(/_/g, " ") : `Tracker ${trackerId}`;
  };

  const selectedTracker = selectedDraft
    ? trackers.find((t) => t._id === selectedDraft.trackerId) || null
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-dvh sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={false}>
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 shrink-0">
            <DialogTitle>Draft Entries</DialogTitle>
            <DialogDescription>
              Your saved draft entries. Click on a draft to continue editing.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute z-10 top-2 right-3"
              disabled={deleteDraftMutation.isPending}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <div className="space-y-3 flex-1 overflow-y-auto px-4 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading drafts...
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No draft entries yet. Start creating a log entry and use &quot;Save Draft&quot; to save your progress.
              </div>
            ) : (
              drafts.map((draft) => (
                <Card
                  key={draft._id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleDraftClick(draft)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">
                        {getTrackerName(draft.trackerId)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last updated: {new Date(draft.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(draft);
                      }}
                      disabled={deleteDraftMutation.isPending}
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDraft && selectedTracker && (
        <LogEntryDialog
          open={logDialogOpen}
          onOpenChange={(open) => {
            setLogDialogOpen(open);
            if (!open) {
              setSelectedDraft(null);
            }
          }}
          tracker={selectedTracker}
          draft={selectedDraft}
        />
      )}
    </>
  );
}
