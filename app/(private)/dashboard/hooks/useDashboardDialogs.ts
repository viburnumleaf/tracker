import { useState, useCallback } from "react";

export function useDashboardDialogs() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logsListDialogOpen, setLogsListDialogOpen] = useState(false);
  const [allLogsListDialogOpen, setAllLogsListDialogOpen] = useState(false);
  const [draftsListDialogOpen, setDraftsListDialogOpen] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [trackerToEditId, setTrackerToEditId] = useState<string | null>(null);

  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const openEditDialog = useCallback((trackerId: string) => {
    setTrackerToEditId(trackerId);
    setEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setTrackerToEditId(null);
  }, []);

  const openLogDialog = useCallback((trackerId: string) => {
    setSelectedTrackerId(trackerId);
    setLogDialogOpen(true);
  }, []);

  const closeLogDialog = useCallback(() => {
    setLogDialogOpen(false);
    setSelectedTrackerId(null);
  }, []);

  const openLogsListDialog = useCallback((trackerId: string) => {
    setSelectedTrackerId(trackerId);
    setLogsListDialogOpen(true);
  }, []);

  const closeLogsListDialog = useCallback(() => {
    setLogsListDialogOpen(false);
    setSelectedTrackerId(null);
  }, []);

  const openDraftsListDialog = useCallback(() => {
    setDraftsListDialogOpen(true);
  }, []);

  const closeDraftsListDialog = useCallback(() => {
    setDraftsListDialogOpen(false);
  }, []);

  const openAllLogsListDialog = useCallback(() => {
    setAllLogsListDialogOpen(true);
  }, []);

  const closeAllLogsListDialog = useCallback(() => {
    setAllLogsListDialogOpen(false);
  }, []);

  return {
    createDialog: {
      open: createDialogOpen,
      openDialog: openCreateDialog,
      closeDialog: closeCreateDialog,
    },
    editDialog: {
      open: editDialogOpen,
      trackerId: trackerToEditId,
      openDialog: openEditDialog,
      closeDialog: closeEditDialog,
    },
    logDialog: {
      open: logDialogOpen,
      trackerId: selectedTrackerId,
      openDialog: openLogDialog,
      closeDialog: closeLogDialog,
    },
    logsListDialog: {
      open: logsListDialogOpen,
      trackerId: selectedTrackerId,
      openDialog: openLogsListDialog,
      closeDialog: closeLogsListDialog,
    },
    allLogsListDialog: {
      open: allLogsListDialogOpen,
      openDialog: openAllLogsListDialog,
      closeDialog: closeAllLogsListDialog,
    },
    draftsListDialog: {
      open: draftsListDialogOpen,
      openDialog: openDraftsListDialog,
      closeDialog: closeDraftsListDialog,
    },
  };
}
