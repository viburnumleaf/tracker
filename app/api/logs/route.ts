import { withAuth } from "@/src/lib/api-handler";
import { getTrackers, createTracker, deleteTracker } from "@/src/domains/trackers/trackers.controller";
import { NextResponse } from "next/server";

export const GET = withAuth(async (userId) => getTrackers(userId));

export const POST = withAuth(async (userId, request) => 
  createTracker(userId, request)
);

export const DELETE = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");
  if (!trackerId) {
    return NextResponse.json({ error: "trackerId is required" }, {
      status: 400,
    });
  }
  return deleteTracker(userId, trackerId);
});
