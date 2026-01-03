import { NextResponse } from "next/server";
import {
  UserTrackersService,
  updateTrackersOrderSchema,
} from "./user-trackers.service";
import { z } from "zod";

const userTrackersService = new UserTrackersService();

export async function getUserTrackers(userId: string) {
  try {
    const trackerIds = await userTrackersService.getUserTrackerIds(userId);
    return NextResponse.json({ trackerIds });
  } catch (error) {
    console.error("Error fetching user trackers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function updateTrackersOrder(userId: string, request: Request) {
  try {
    const body = await request.json();
    const validatedData = updateTrackersOrderSchema.parse(body);

    const trackerIds = await userTrackersService.updateTrackersOrder(
      userId,
      validatedData
    );

    return NextResponse.json({ success: true, trackerIds });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid tracker ID format") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (
        errorMessage === "Some tracker IDs are invalid" ||
        errorMessage === "You don't have access to some of these trackers"
      ) {
        return NextResponse.json({ error: errorMessage }, { status: 403 });
      }
    }
    console.error("Error updating tracker order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function addTracker(userId: string, request: Request) {
  try {
    const body = await request.json();
    const { trackerId } = body;

    if (!trackerId || typeof trackerId !== "string") {
      return NextResponse.json(
        { error: "trackerId is required" },
        { status: 400 }
      );
    }

    const result = await userTrackersService.addTrackerToUser(userId, trackerId);

    return NextResponse.json(result);
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
    console.error("Error adding tracker to user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function removeTracker(userId: string, trackerId: string) {
  try {
    if (!trackerId) {
      return NextResponse.json(
        { error: "trackerId is required" },
        { status: 400 }
      );
    }

    const result = await userTrackersService.removeTrackerFromUser(
      userId,
      trackerId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error removing tracker from user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
