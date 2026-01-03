import { NextResponse } from "next/server";
import { TrackersService, createTrackerSchema, updateTrackerSchema } from "./trackers.service";
import { z } from "zod";

const trackersService = new TrackersService();

export async function getTrackers(userId: string, request?: Request) {
  try {
    const includeDeleted = request
      ? new URL(request.url).searchParams.get("includeDeleted") === "true"
      : false;
    const trackers = await trackersService.getUserTrackers(userId, includeDeleted);
    return NextResponse.json(trackers);
  } catch (error) {
    console.error("Error fetching trackers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function createTracker(userId: string, request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTrackerSchema.parse(body);

    const tracker = await trackersService.createTracker(userId, validatedData);

    return NextResponse.json(tracker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function updateTracker(userId: string, trackerId: string, request: Request) {
  try {
    const body = await request.json();
    const validatedData = updateTrackerSchema.parse(body);

    const tracker = await trackersService.updateTracker(userId, trackerId, validatedData);

    return NextResponse.json(tracker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid tracker ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Tracker not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error updating tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function deleteTracker(userId: string, trackerId: string) {
  try {
    await trackersService.deleteTracker(userId, trackerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid tracker ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Tracker not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error deleting tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function permanentlyDeleteTracker(userId: string, trackerId: string) {
  try {
    await trackersService.permanentlyDeleteTracker(trackerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid tracker ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Tracker not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error permanently deleting tracker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
