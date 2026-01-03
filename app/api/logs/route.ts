import { getAuth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTrackerSchema = z.object({
  name: z.string().min(1).max(100),
  schema: z.object({
    type: z.literal("object"),
    properties: z.record(
      z.string(),
      z.object({
        type: z.enum(["string", "number", "boolean", "array", "object"]),
        title: z.string().optional(),
        description: z.string().optional(),
        enum: z.array(z.string()).optional(),
        default: z.unknown().optional(),
        format: z.enum(["date-time", "date", "time"]).optional(),
        items: z.unknown().optional(),
        properties: z.record(z.string(), z.unknown()).optional(),
        required: z.array(z.string()).optional(),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
      })
    ),
    required: z.array(z.string()).optional(),
  }),
});

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await db();
    const trackers = await database
      .collection("trackers")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(trackers);
  } catch (error) {
    console.error("Error fetching trackers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTrackerSchema.parse(body);

    // Normalize name: lowercase, replace spaces with underscores
    const normalizedName = validatedData.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const collectionName = `track_${normalizedName}`;

    const database = await db();
    const client = await database.client;

    // Check if tracker with this name already exists
    const existingTracker = await database.collection("trackers").findOne({
      userId: session.user.id,
      name: normalizedName,
    });

    if (existingTracker) {
      return NextResponse.json(
        { error: "Tracker with this name already exists" },
        { status: 400 }
      );
    }

    // Create the tracker metadata
    const now = new Date().toISOString();
    const tracker = {
      userId: session.user.id,
      name: normalizedName,
      schema: validatedData.schema,
      createdAt: now,
      updatedAt: now,
    };

    const result = await database.collection("trackers").insertOne(tracker);

    // Create the collection for log entries
    // In MongoDB, collections are created automatically on first insert
    // But we can explicitly create it if needed
    const logCollection = database.collection(collectionName);
    // Create indexes for better query performance
    await logCollection.createIndex({ userId: 1, createdAt: -1 });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...tracker,
    });
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
