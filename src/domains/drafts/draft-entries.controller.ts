import { NextResponse } from "next/server";
import {
  DraftEntriesService,
  createDraftEntrySchema,
} from "./draft-entries.service";
import { z } from "zod";

const draftEntriesService = new DraftEntriesService();

export async function getDraftEntries(userId: string) {
  try {
    const entries = await draftEntriesService.getDraftEntries(userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching draft entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function getDraftEntry(userId: string, draftId: string) {
  try {
    const entry = await draftEntriesService.getDraftEntry(userId, draftId);
    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid draft ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Draft not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error fetching draft entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function createDraftEntry(userId: string, request: Request) {
  try {
    const body = await request.json();
    const validatedData = createDraftEntrySchema.parse(body);

    const entry = await draftEntriesService.createDraftEntry(
      userId,
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
    console.error("Error creating draft entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function updateDraftEntry(
  userId: string,
  draftId: string,
  request: Request
) {
  try {
    const body = await request.json();
    const validatedData = createDraftEntrySchema.parse(body);

    const entry = await draftEntriesService.updateDraftEntry(
      userId,
      draftId,
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
      if (errorMessage === "Invalid draft ID" || errorMessage === "Invalid tracker ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Draft not found" || errorMessage === "Tracker not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error updating draft entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function deleteDraftEntry(userId: string, draftId: string) {
  try {
    await draftEntriesService.deleteDraftEntry(userId, draftId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage === "Invalid draft ID") {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage === "Draft not found") {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }
    }
    console.error("Error deleting draft entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
