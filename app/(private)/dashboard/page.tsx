"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useLogout } from "@/src/features/auth/hooks";
import { useTrackers } from "@/src/features/trackers/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Plus, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateTrackerDialog } from "@/components/trackers/CreateTrackerDialog";
import { LogEntryDialog } from "@/components/trackers/LogEntryDialog";
import { Tracker } from "@/src/api/trackers/trackers.api";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, isAuthenticated } = useAuth();
  const { user } = useUser();
  const logoutMutation = useLogout();
  const { trackers, isLoading: trackersLoading } = useTrackers();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

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
    setSelectedTracker(tracker);
    setLogDialogOpen(true);
  };

  const filteredTrackers = useMemo(() => {
    if (!searchQuery.trim()) return trackers;
    const query = searchQuery.toLowerCase();
    return trackers.filter((tracker) =>
      tracker.name.toLowerCase().includes(query)
    );
  }, [trackers, searchQuery]);

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
          <h2 className="text-xl font-semibold">My trackers</h2>
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
              {filteredTrackers.map((tracker) => (
                <Card
                  key={tracker._id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleTrackerClick(tracker)}
                >
                  <h3 className="font-semibold text-lg mb-2 capitalize">
                    {tracker.name.replace(/_/g, " ")}
                  </h3>
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
              ))}
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
      <LogEntryDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        tracker={selectedTracker}
      />
    </div>
  );
}
