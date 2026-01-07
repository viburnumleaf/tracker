"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { List, Pencil, Trash2, GripVertical } from "lucide-react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { cn } from "@/lib/utils";
import { trackersApi } from "@/src/api/trackers/trackers.api";
import { useQueryClient } from "@tanstack/react-query";
import { useLastLogEntries } from "@/src/features/trackers/hooks/useLastLogEntries";
import { TimeAgo } from "./TimeAgo";

type TrackersListProps = {
  trackers: (Tracker & { isDeleted?: boolean })[];
  isAdminMode: boolean;
  onTrackerClick: (tracker: Tracker) => void;
  onViewLogsClick: (tracker: Tracker) => void;
  onEditClick: (tracker: Tracker) => void;
  onDeleteClick: (tracker: Tracker & { isDeleted?: boolean }) => void;
  isDeleting?: boolean;
  includeDeleted?: boolean;
}

type SortableTrackerItemProps = {
  tracker: Tracker & { isDeleted?: boolean };
  isAdminMode: boolean;
  onTrackerClick: (tracker: Tracker) => void;
  onViewLogsClick: (tracker: Tracker) => void;
  onEditClick: (tracker: Tracker) => void;
  onDeleteClick: (tracker: Tracker & { isDeleted?: boolean }) => void;
  isDeleting?: boolean;
}

const SortableTrackerItem = ({
  tracker,
  isAdminMode,
  onTrackerClick,
  onViewLogsClick,
  onEditClick,
  onDeleteClick,
  isDeleting = false,
  lastLogEntry,
}: SortableTrackerItemProps & { lastLogEntry?: { createdAt: string } | null }) => {
  const isDeleted = tracker.isDeleted || false;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tracker._id,
    disabled: isDeleted, // Disable dragging for deleted trackers
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 sm:p-3 md:p-4 cursor-pointer hover:bg-accent transition-colors relative",
        isDeleted && "opacity-50 border-dashed border-2 border-destructive"
      )}
      onClick={() => !isDeleted && onTrackerClick(tracker)}
    >
      <div className="flex flex-col gap-2 h-full">
        {/* Mobile: Title and actions in one row */}
        <div className={cn('flex flex-col sm:flex-row items-start justify-between gap-1 sm:gap-2 h-full')}>
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            {!isDeleted && (
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "cursor-grab active:cursor-grabbing touch-none",
                  "opacity-40 hover:opacity-100 transition-opacity",
                  "p-1 -ml-1"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="size-3 sm:size-4 text-muted-foreground" />
              </button>
            )}
            <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg capitalize flex-1 min-w-0">
              <span className="block">{tracker.name.replace(/_/g, " ")}</span>
              {isDeleted && (
                <span className="text-[10px] sm:text-xs text-destructive">(Deleted)</span>
              )}
            </h3>
          </div>
          <div 
            className="flex gap-0.5 sm:gap-1 shrink-0 mt-auto sm:mt-0" 
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
          {lastLogEntry ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Last log: <TimeAgo date={lastLogEntry.createdAt} className="font-medium" />
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              No logs yet
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Created: {new Date(tracker.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {Object.keys(tracker.schema.properties || {}).length} field
            {Object.keys(tracker.schema.properties || {}).length !== 1 ? "s" : ""}
          </p>
        </div>
        
        {/* Mobile: Show last log time */}
        <div className="sm:hidden">
          {lastLogEntry ? (
            <p className="text-[10px] text-muted-foreground">
              Last: <TimeAgo date={lastLogEntry.createdAt} />
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              No logs
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export const TrackersList = ({
  trackers,
  isAdminMode,
  onTrackerClick,
  onViewLogsClick,
  onEditClick,
  onDeleteClick,
  isDeleting = false,
  includeDeleted = false,
}: TrackersListProps) => {
  const [items, setItems] = useState(trackers);
  const queryClient = useQueryClient();
  
  // Get last log entries for all trackers
  const { lastLogEntriesMap } = useLastLogEntries(items);

  // Update local state when trackers prop changes
  useEffect(() => {
    setItems(trackers);
  }, [trackers]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate active and deleted trackers
  const activeTrackers = items.filter((t) => !t.isDeleted);
  const deletedTrackers = items.filter((t) => t.isDeleted);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activeTrackers.findIndex((t) => t._id === active.id);
    const newIndex = activeTrackers.findIndex((t) => t._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder only active trackers
    const newActiveTrackers = arrayMove(activeTrackers, oldIndex, newIndex);
    
    // Combine with deleted trackers if needed
    const newItems = includeDeleted
      ? [...newActiveTrackers, ...deletedTrackers]
      : newActiveTrackers;

    setItems(newItems);

    // Update order in database (only for active trackers)
    const trackerIds = newActiveTrackers.map((t) => t._id);
    trackersApi
      .updateTrackersOrder(trackerIds)
      .then(() => {
        // Invalidate and refetch trackers
        queryClient.invalidateQueries({ queryKey: ["trackers", includeDeleted] });
      })
      .catch((error) => {
        console.error("Failed to update tracker order:", error);
        // Revert on error
        setItems(trackers);
      });
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No trackers yet. Create your first tracker to get started!
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activeTrackers.map((t) => t._id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {items.map((tracker) => {
            const lastLogEntry = lastLogEntriesMap.get(tracker._id);
            return (
              <SortableTrackerItem
                key={tracker._id}
                tracker={tracker}
                isAdminMode={isAdminMode}
                onTrackerClick={onTrackerClick}
                onViewLogsClick={onViewLogsClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                isDeleting={isDeleting}
                lastLogEntry={lastLogEntry || undefined}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
