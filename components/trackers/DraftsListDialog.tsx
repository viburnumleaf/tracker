"use client";

import { useDrafts, useDeleteDraft } from "@/src/features/drafts/hooks";
import { useTrackers } from "@/src/features/trackers/hooks";
import { DialogLayout } from "./DialogLayout";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useDeleteConfirmation, useLinkedDialog } from "./hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DraftEntry } from "@/src/api/drafts/drafts.api";
import { Trash2 } from "lucide-react";
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
  
  const {
    deleteConfirmOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useDeleteConfirmation<DraftEntry>({
    onConfirm: async (draft) => {
      await deleteDraftMutation.mutateAsync(draft._id);
    },
  });

  const {
    linkedDialogOpen,
    selectedItem: selectedDraft,
    openLinkedDialog,
    handleOpenChange: handleLinkedDialogChange,
  } = useLinkedDialog<DraftEntry>();

  const getTrackerName = (trackerId: string) => {
    const tracker = trackers.find((t) => t._id === trackerId);
    return tracker ? tracker.name.replace(/_/g, " ") : `Tracker ${trackerId}`;
  };

  const selectedTracker = selectedDraft
    ? trackers.find((t) => t._id === selectedDraft.trackerId) || null
    : null;

  return (
    <>
      <DialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="Draft Entries"
        description="Your saved draft entries. Click on a draft to continue editing."
      >
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No draft entries yet. Start creating a log entry and use &quot;Save
              Draft&quot; to save your progress.
            </div>
          ) : (
            drafts.map((draft) => (
              <Card
                key={draft._id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openLinkedDialog(draft)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="font-medium">
                      {getTrackerName(draft.trackerId)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated:{" "}
                      {new Date(draft.updatedAt).toLocaleString()}
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
      </DialogLayout>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel();
        }}
        title="Delete Draft?"
        description="Are you sure you want to delete this draft? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDraftMutation.isPending}
      />

      {selectedDraft && selectedTracker && (
        <LogEntryDialog
          open={linkedDialogOpen}
          onOpenChange={handleLinkedDialogChange}
          tracker={selectedTracker}
          draft={selectedDraft}
        />
      )}
    </>
  );
}
