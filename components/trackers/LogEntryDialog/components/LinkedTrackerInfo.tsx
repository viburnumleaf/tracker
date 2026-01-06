import { Link2 } from "lucide-react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LinkedTrackerInfo as LinkedTrackerInfoType } from "../types";

type LinkedTrackerInfoProps = {
  linkedTrackerInfo: LinkedTrackerInfoType[] | null;
  onLinkedTrackerClick: (linkedTracker: Tracker | null) => void;
}

export const LinkedTrackerInfo = ({
  linkedTrackerInfo,
  onLinkedTrackerClick,
}: LinkedTrackerInfoProps) => {
  if (!linkedTrackerInfo || linkedTrackerInfo.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        This tracker is not linked to any other trackers.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {linkedTrackerInfo.map((link, index) => (
        <div key={index} className="text-xs">
          {link.linkedTracker ? (
            <button
              type="button"
              onClick={() => onLinkedTrackerClick(link.linkedTracker)}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Link2 className="size-3" />
              Field &quot;{link.fieldTitle}&quot; → Tracker &quot;
              {link.linkedTracker.name.replace(/_/g, " ")}&quot;
            </button>
          ) : (
            <span className="text-muted-foreground">
              Field &quot;{link.fieldTitle}&quot; → Tracker &quot;
              {link.linkedTrackerName}&quot; (not found)
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
