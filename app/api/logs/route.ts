import { withAuth } from "@/src/lib/api-handler";
import { getTrackers, createTracker, updateTracker, deleteTracker, permanentlyDeleteTracker } from "@/src/domains/trackers/trackers.controller";
import { NextResponse } from "next/server";

export const GET = withAuth(async (userId, request) => getTrackers(userId, request));

export const POST = withAuth(async (userId, request) => 
  createTracker(userId, request)
);

export const PUT = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");
  
  if (!trackerId) {
    return NextResponse.json({ error: "trackerId is required" }, {
      status: 400,
    });
  }
  
  return updateTracker(userId, trackerId, request);
});

export const DELETE = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");
  const permanent = searchParams.get("permanent") === "true";
  
  if (!trackerId) {
    return NextResponse.json({ error: "trackerId is required" }, {
      status: 400,
    });
  }
  
  if (permanent) {
    return permanentlyDeleteTracker(userId, trackerId);
  }
  
  return deleteTracker(userId, trackerId);
});
