"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAdminMode } from "@/src/features/auth/hooks";
import { useTrackers } from "@/src/features/trackers/hooks";
import {
  CreateTrackerDialog,
  EditTrackerDialog,
  LogEntryDialog,
  LogEntriesListDialog,
  DraftsListDialog,
} from "@/components/trackers";
import {
  useDashboardDialogs,
  useDeleteTrackerDialog,
  useFilteredTrackers,
} from "./hooks";
import {
  DashboardHeader,
  TrackersSection,
  SearchBar,
  DeleteTrackerDialog,
} from "./components";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const isAdminMode = useAdminMode();
  const { trackers, isLoading: trackersLoading } = useTrackers(isAdminMode);
  const [searchQuery, setSearchQuery] = useState("");

  const dialogs = useDashboardDialogs();
  const deleteTracker = useDeleteTrackerDialog();
  const filteredTrackers = useFilteredTrackers(trackers, searchQuery, isAdminMode);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const selectedTracker = dialogs.logDialog.trackerId
    ? trackers.find((t) => t._id === dialogs.logDialog.trackerId) || null
    : null;

  const selectedTrackerForLogs = dialogs.logsListDialog.trackerId
    ? trackers.find((t) => t._id === dialogs.logsListDialog.trackerId) || null
    : null;

  const trackerToEdit = dialogs.editDialog.trackerId
    ? trackers.find((t) => t._id === dialogs.editDialog.trackerId) || null
    : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="w-full flex-1 p-4 sm:p-6 pb-20 sm:pb-24">
        <DashboardHeader />
        <TrackersSection
          trackers={filteredTrackers}
          isAdminMode={isAdminMode}
          isLoading={trackersLoading}
          searchQuery={searchQuery}
          onTrackerClick={(tracker) => dialogs.logDialog.openDialog(tracker._id)}
          onViewLogsClick={(tracker) => dialogs.logsListDialog.openDialog(tracker._id)}
          onEditClick={(tracker) => dialogs.editDialog.openDialog(tracker._id)}
          onDeleteClick={deleteTracker.openDeleteConfirm}
          isDeleting={deleteTracker.isLoading}
        />
      </div>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTracker={dialogs.createDialog.openDialog}
        onViewDrafts={dialogs.draftsListDialog.openDialog}
      />

      <CreateTrackerDialog
        open={dialogs.createDialog.open}
        onOpenChange={(open) => {
          if (open) dialogs.createDialog.openDialog();
          else dialogs.createDialog.closeDialog();
        }}
      />

      <EditTrackerDialog
        open={dialogs.editDialog.open}
        onOpenChange={(open) => {
          if (open && dialogs.editDialog.trackerId) {
            dialogs.editDialog.openDialog(dialogs.editDialog.trackerId);
          } else {
            dialogs.editDialog.closeDialog();
          }
        }}
        tracker={trackerToEdit}
      />

      <LogEntryDialog
        open={dialogs.logDialog.open}
        onOpenChange={(open) => {
          if (open && dialogs.logDialog.trackerId) {
            dialogs.logDialog.openDialog(dialogs.logDialog.trackerId);
          } else {
            dialogs.logDialog.closeDialog();
          }
        }}
        tracker={selectedTracker}
      />

      <LogEntriesListDialog
        open={dialogs.logsListDialog.open}
        onOpenChange={(open) => {
          if (open && dialogs.logsListDialog.trackerId) {
            dialogs.logsListDialog.openDialog(dialogs.logsListDialog.trackerId);
          } else {
            dialogs.logsListDialog.closeDialog();
          }
        }}
        tracker={selectedTrackerForLogs}
      />

      <DraftsListDialog
        open={dialogs.draftsListDialog.open}
        onOpenChange={(open) => {
          if (open) dialogs.draftsListDialog.openDialog();
          else dialogs.draftsListDialog.closeDialog();
        }}
      />

      <DeleteTrackerDialog
        open={deleteTracker.deleteConfirmOpen}
        onOpenChange={(open) => {
          if (open && deleteTracker.trackerToDelete) {
            deleteTracker.openDeleteConfirm(deleteTracker.trackerToDelete);
          } else {
            deleteTracker.closeDeleteConfirm();
          }
        }}
        isPermanentDelete={deleteTracker.isPermanentDelete}
        onConfirm={deleteTracker.confirmDelete}
        isLoading={deleteTracker.isLoading}
      />
    </div>
  );
}
