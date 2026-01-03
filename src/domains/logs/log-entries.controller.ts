import { NextResponse } from "next/server";
import {
  LogEntriesService,
  createLogEntrySchema,
} from "./log-entries.service";
import { z } from "zod";

const logEntriesService = new LogEntriesService();

export async function getLogEntries(userId: string, trackerId: string) {
  try {
    const entries = await logEntriesService.getLogEntries(userId, trackerId);
    return NextResponse.json(entries);
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
    console.error("Error fetching log entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function createLogEntry(userId: string, trackerId: string, request: Request) {
  try {
    const body = await request.json();
    const validatedData = createLogEntrySchema.parse(body);

    const entry = await logEntriesService.createLogEntry(
      userId,
      trackerId,
      validatedData
    );

    return NextResponse.json(entry);
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
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function deleteLogEntry(userId: string, logEntryId: string) {
  try {
    await logEntriesService.deleteLogEntry(userId, logEntryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid log entry ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Log entry not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error deleting log entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
