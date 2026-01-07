"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { List, Pencil, Trash2 } from "lucide-react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { cn } from "@/lib/utils";

interface TrackersListProps {
  trackers: (Tracker & { isDeleted?: boolean })[];
  isAdminMode: boolean;
  onTrackerClick: (tracker: Tracker) => void;
  onViewLogsClick: (tracker: Tracker) => void;
  onEditClick: (tracker: Tracker) => void;
  onDeleteClick: (tracker: Tracker & { isDeleted?: boolean }) => void;
  isDeleting?: boolean;
}

export function TrackersList({
  trackers,
  isAdminMode,
  onTrackerClick,
  onViewLogsClick,
  onEditClick,
  onDeleteClick,
  isDeleting = false,
}: TrackersListProps) {
  if (trackers.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No trackers yet. Create your first tracker to get started!
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
      {trackers.map((tracker) => {
        const isDeleted = tracker.isDeleted || false;
        return (
          <Card
            key={tracker._id}
            className={`p-2 sm:p-3 md:p-4 cursor-pointer hover:bg-accent transition-colors relative ${
              isDeleted
                ? "opacity-50 border-dashed border-2 border-destructive"
                : ""
            }`}
            onClick={() => !isDeleted && onTrackerClick(tracker)}
          >
            <div className="flex flex-col gap-2">
              {/* Mobile: Title and actions in one row */}
              <div className={cn('flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 sm:gap-2')}>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg capitalize flex-1 line-clamp-2 min-w-0">
                  <span className="block truncate">{tracker.name.replace(/_/g, " ")}</span>
                  {isDeleted && (
                    <span className="text-[10px] sm:text-xs text-destructive">(Deleted)</span>
                  )}
                </h3>
                <div 
                  className="flex gap-0.5 sm:gap-1 shrink-0" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLogsClick(tracker);
                        }}
                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0"
                      >
                        <List className="size-3 sm:size-3.5 md:size-4" />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(tracker);
                          }}
                          className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0"
                        >
                          <Pencil className="size-3 sm:size-3.5 md:size-4" />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(tracker);
                        }}
                        disabled={isDeleting}
                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3 sm:size-3.5 md:size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isDeleted ? "Permanently delete tracker" : "Delete tracker"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              {/* Mobile: Hide meta info, show on larger screens */}
              <div className="hidden sm:block space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Created: {new Date(tracker.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(tracker.schema.properties || {}).length} field
                  {Object.keys(tracker.schema.properties || {}).length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
