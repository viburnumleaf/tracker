import { withAuth } from "@/src/lib/api-handler";
import {
  getUserTrackers,
  updateTrackersOrder,
  addTracker,
  removeTracker,
} from "@/src/domains/trackers/user-trackers.controller";

export const GET = withAuth(async (userId) => 
  getUserTrackers(userId)
);

export const PUT = withAuth(async (userId, request) => 
  updateTrackersOrder(userId, request)
);

export const POST = withAuth(async (userId, request) => 
  addTracker(userId, request)
);

export const DELETE = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");
  return removeTracker(userId, trackerId || "");
});
