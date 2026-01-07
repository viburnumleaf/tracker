"use client";

import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, FileText, List } from "lucide-react";

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddTracker: () => void;
  onViewDrafts: () => void;
  onViewAllLogs: () => void;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onAddTracker,
  onViewDrafts,
  onViewAllLogs,
}: SearchBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-3 sm:p-4 shadow-lg">
      <div className="mx-auto max-w-4xl">
        <InputGroup className="w-full">
          <InputGroupAddon align="inline-start">
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Search trackers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={onViewAllLogs}
                    variant="outline"
                    size="icon-sm"
                    className="ml-2 -mr-1"
                    aria-label="View all logs"
                  >
                    <List className="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all logs</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={onViewDrafts}
                    variant="outline"
                    size="icon-sm"
                    className="-mr-1"
                    aria-label="View drafts"
                  >
                    <FileText className="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View drafts</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={onAddTracker}
                    variant="default"
                    size="icon-sm"
                    className="-mr-1"
                    aria-label="Add new tracker"
                  >
                    <Plus className="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new tracker</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
