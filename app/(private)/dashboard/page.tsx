"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useLogout, useCapsLock } from "@/src/features/auth/hooks";
import { useTrackers, useDeleteTracker, usePermanentlyDeleteTracker } from "@/src/features/trackers/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Plus, Search, Trash2, List, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateTrackerDialog } from "@/components/trackers/CreateTrackerDialog";
import { EditTrackerDialog } from "@/components/trackers/EditTrackerDialog";
import { LogEntryDialog } from "@/components/trackers/LogEntryDialog";
import { LogEntriesListDialog } from "@/components/trackers/LogEntriesListDialog";
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
import { Tracker } from "@/src/api/trackers/trackers.api";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, isAuthenticated } = useAuth();
  const { user } = useUser();
  const logoutMutation = useLogout();
  const isAdminMode = useCapsLock();
  const { trackers, isLoading: trackersLoading } = useTrackers(isAdminMode);
  const deleteTrackerMutation = useDeleteTracker();
  const permanentlyDeleteTrackerMutation = usePermanentlyDeleteTracker();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [trackerToEditId, setTrackerToEditId] = useState<string | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logsListDialogOpen, setLogsListDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<(Tracker & { isDeleted?: boolean }) | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleAddTracker = () => {
    setCreateDialogOpen(true);
  };

  const handleTrackerClick = (tracker: Tracker) => {
    setSelectedTrackerId(tracker._id);
    setLogDialogOpen(true);
  };

  const handleDeleteTrackerClick = (e: React.MouseEvent, tracker: Tracker & { isDeleted?: boolean }) => {
    e.stopPropagation();
    setTrackerToDelete(tracker);
    setIsPermanentDelete(tracker.isDeleted || false);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTrackerConfirm = async () => {
    if (!trackerToDelete) return;

    try {
      if (isPermanentDelete) {
        await permanentlyDeleteTrackerMutation.mutateAsync(trackerToDelete._id);
      } else {
        await deleteTrackerMutation.mutateAsync(trackerToDelete._id);
      }
      setDeleteConfirmOpen(false);
      setTrackerToDelete(null);
      setIsPermanentDelete(false);
    } catch (error) {
      console.error("Failed to delete tracker:", error);
    }
  };

  const handleViewLogsClick = (e: React.MouseEvent, tracker: Tracker) => {
    e.stopPropagation();
    setSelectedTrackerId(tracker._id);
    setLogsListDialogOpen(true);
  };

  const handleEditTrackerClick = (e: React.MouseEvent, tracker: Tracker) => {
    e.stopPropagation();
    setTrackerToEditId(tracker._id);
    setEditDialogOpen(true);
  };

  const filteredTrackers = useMemo(() => {
    // Filter out deleted trackers when not in admin mode
    const visibleTrackers = isAdminMode
      ? trackers
      : trackers.filter((tracker) => !tracker.isDeleted);
    
    // Apply search filter
    if (!searchQuery.trim()) return visibleTrackers;
    const query = searchQuery.toLowerCase();
    return visibleTrackers.filter((tracker) =>
      tracker.name.toLowerCase().includes(query)
    );
  }, [trackers, searchQuery, isAdminMode]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="w-full flex-1 p-6 pb-24">
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button
              onClick={handleLogout}
              variant="destructive"
              disabled={logoutMutation.isPending}
              className="cursor-pointer"
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
          {user && (
            <div className="space-y-2">
              <p className="text-muted-foreground">Welcome back!</p>
              <p className="font-medium">User: {user.email || "Unknown"}</p>
            </div>
          )}
        </Card>

        {/* List of trackers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My trackers</h2>
            {isAdminMode && (
              <span className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                Admin Mode (Caps Lock)
              </span>
            )}
          </div>
          {trackersLoading ? (
            <div className="text-muted-foreground text-sm">Loading trackers...</div>
          ) : filteredTrackers.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              {searchQuery
                ? "No trackers found matching your search"
                : "No trackers yet. Create your first tracker to get started!"}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrackers.map((tracker) => {
                const isDeleted = tracker.isDeleted || false;
                return (
                  <Card
                    key={tracker._id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors relative ${
                      isDeleted
                        ? "opacity-50 border-dashed border-2 border-destructive"
                        : ""
                    }`}
                    onClick={() => !isDeleted && handleTrackerClick(tracker)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg capitalize flex-1">
                        {tracker.name.replace(/_/g, " ")}
                        {isDeleted && (
                          <span className="ml-2 text-xs text-destructive">(Deleted)</span>
                        )}
                      </h3>
                      <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleViewLogsClick(e, tracker)}
                              className="h-8 w-8 p-0"
                            >
                              <List className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View all logs</p>
                          </TooltipContent>
                        </Tooltip>
                        {isAdminMode && !isDeleted && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEditTrackerClick(e, tracker)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit tracker schema</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteTrackerClick(e, tracker)}
                              disabled={deleteTrackerMutation.isPending || permanentlyDeleteTrackerMutation.isPending}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isDeleted ? "Permanently delete tracker" : "Delete tracker"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(tracker.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Object.keys(tracker.schema.properties || {}).length} field
                      {Object.keys(tracker.schema.properties || {}).length !== 1
                        ? "s"
                        : ""}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed search panel at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-4 shadow-lg">
        <div className="mx-auto max-w-4xl">
          <InputGroup className="w-full">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Search trackers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={handleAddTracker}
                    variant="default"
                    size="icon-sm"
                    className="ml-2 -mr-1"
                    aria-label="Add new tracker"
                  >
                    <Plus className="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new tracker</p>
                </TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <CreateTrackerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditTrackerDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setTrackerToEditId(null);
          }
        }}
        tracker={trackers.find((t) => t._id === trackerToEditId) || null}
      />
      <LogEntryDialog
        open={logDialogOpen}
        onOpenChange={(open) => {
          setLogDialogOpen(open);
          if (!open) {
            setSelectedTrackerId(null);
          }
        }}
        tracker={trackers.find((t) => t._id === selectedTrackerId) || null}
      />
      <LogEntriesListDialog
        open={logsListDialogOpen}
        onOpenChange={(open) => {
          setLogsListDialogOpen(open);
          if (!open) {
            setSelectedTrackerId(null);
          }
        }}
        tracker={trackers.find((t) => t._id === selectedTrackerId) || null}
      />
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrackerConfirm}
              disabled={deleteTrackerMutation.isPending || permanentlyDeleteTrackerMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteTrackerMutation.isPending || permanentlyDeleteTrackerMutation.isPending)
                ? "Deleting..."
                : isPermanentDelete
                ? "Permanently Delete"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
