import { getAuth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

const createLogEntrySchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackerId: string }> }
) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackerId } = await params;
    const database = await db();

    // Verify tracker exists and belongs to user
    let tracker;
    try {
      tracker = await database.collection("trackers").findOne({
        _id: new ObjectId(trackerId),
        userId: session.user.id,
      });
    } catch (error) {
      // Invalid ObjectId format
      return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 });
    }

    if (!tracker) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    const collectionName = `track_${tracker.name}`;
    const entries = await database
      .collection(collectionName)
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching log entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackerId: string }> }
) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackerId } = await params;
    const body = await request.json();
    const validatedData = createLogEntrySchema.parse(body);

    const database = await db();

    // Verify tracker exists and belongs to user
    let tracker;
    try {
      tracker = await database.collection("trackers").findOne({
        _id: new ObjectId(trackerId),
        userId: session.user.id,
      });
    } catch (error) {
      // Invalid ObjectId format
      return NextResponse.json({ error: "Invalid tracker ID" }, { status: 400 });
    }

    if (!tracker) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    // TODO: Validate data against schema (can use ajv or zod schema compilation)

    const collectionName = `track_${tracker.name}`;
    const now = new Date().toISOString();

    const entry = {
      trackerId: trackerId,
      userId: session.user.id,
      data: validatedData.data,
      createdAt: now,
    };

    const result = await database
      .collection(collectionName)
      .insertOne(entry);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...entry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
