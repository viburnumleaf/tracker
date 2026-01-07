import { NextResponse } from "next/server";
import {
  LogEntriesService,
  createLogEntrySchema,
} from "./log-entries.service";
import { z } from "zod";

const logEntriesService = new LogEntriesService();

export async function getLogEntries(userId: string, trackerId: string, request?: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const includeDeleted = url?.searchParams.get("includeDeleted") === "true";
    const limitParam = url?.searchParams.get("limit");
    const skipParam = url?.searchParams.get("skip");
    
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = skipParam ? parseInt(skipParam, 10) : undefined;

    // Validate pagination parameters
    if (limit !== undefined && (isNaN(limit) || limit < 0 || limit > 10000)) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Must be between 0 and 10000." },
        { status: 400 }
      );
    }
    if (skip !== undefined && (isNaN(skip) || skip < 0)) {
      return NextResponse.json(
        { error: "Invalid skip parameter. Must be >= 0." },
        { status: 400 }
      );
    }

    const entries = await logEntriesService.getLogEntries(
      userId,
      trackerId,
      includeDeleted,
      limit,
      skip
    );
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
      if (errorMessage.startsWith("Validation failed:")) {
        const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
        return NextResponse.json(
          { error: errorMessage, fieldErrors },
          { status: 400 }
        );
      }
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

export async function permanentlyDeleteLogEntry(userId: string, logEntryId: string) {
  try {
    await logEntriesService.permanentlyDeleteLogEntry(logEntryId);
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
    console.error("Error permanently deleting log entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
