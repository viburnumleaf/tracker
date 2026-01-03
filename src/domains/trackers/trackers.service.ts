import { db } from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const createTrackerSchema = z.object({
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

export type CreateTrackerDto = z.infer<typeof createTrackerSchema>;

export class TrackersService {
  /**
   * Get all trackers for a user
   */
  async getUserTrackers(userId: string) {
    const database = await db();

    // Get user's tracker IDs with order
    const userTracker = await database.collection("user_trackers").findOne({
      userId,
    });

    const trackerIds = userTracker?.trackerIds || [];

    if (trackerIds.length === 0) {
      return [];
    }

    // Convert string IDs to ObjectIds
    const objectIds = trackerIds.map((id: string) => new ObjectId(id));

    // Fetch trackers in the user's order
    const trackers = await database
      .collection("trackers")
      .find({ _id: { $in: objectIds } })
      .toArray();

    // Sort trackers according to user's order
    const trackersMap = new Map(trackers.map((t) => [t._id.toString(), t]));
    const orderedTrackers: typeof trackers = [];
    for (const id of trackerIds) {
      const tracker = trackersMap.get(id);
      if (tracker) {
        orderedTrackers.push(tracker);
      }
    }

    return orderedTrackers;
  }

  /**
   * Create a new tracker
   */
  async createTracker(userId: string, data: CreateTrackerDto) {
    const database = await db();

    // Normalize name: lowercase, replace spaces with underscores
    const normalizedName = data.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Check if tracker with this name already exists (globally, not per user)
    const existingTracker = await database.collection("trackers").findOne({
      name: normalizedName,
    });

    let trackerId: string;
    let tracker;

    if (existingTracker) {
      // Tracker already exists - use it
      trackerId = existingTracker._id.toString();
      tracker = existingTracker;
    } else {
      // Create new tracker (shared, no userId)
      const now = new Date().toISOString();
      const newTracker = {
        name: normalizedName,
        schema: data.schema,
        createdAt: now,
        updatedAt: now,
      };

      const result = await database.collection("trackers").insertOne(newTracker);
      trackerId = result.insertedId.toString();
      tracker = { _id: result.insertedId, ...newTracker };
    }

    // Add tracker to user's list if not already there
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $setOnInsert: { userId, trackerIds: [] },
      },
      { upsert: true }
    );

    await database.collection("user_trackers").updateOne(
      { userId, trackerIds: { $ne: trackerId } },
      {
        $push: { trackerIds: trackerId as unknown as string },
      } as unknown as Record<string, unknown>
    );

    return {
      _id: trackerId,
      name: tracker.name,
      schema: tracker.schema,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt,
    };
  }

  /**
   * Soft delete a tracker (only for the user)
   */
  async deleteTracker(userId: string, trackerId: string) {
    const database = await db();

    // Verify tracker exists
    let tracker;
    try {
      tracker = await database.collection("trackers").findOne({
        _id: new ObjectId(trackerId),
      });
    } catch (error) {
      throw new Error("Invalid tracker ID");
    }

    if (!tracker) {
      throw new Error("Tracker not found");
    }

    // Verify user has access to this tracker
    const userTracker = await database.collection("user_trackers").findOne({
      userId,
      trackerIds: trackerId,
    });

    if (!userTracker) {
      throw new Error("Tracker not found");
    }

    // Remove tracker from user's list (soft delete for user)
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $pull: { trackerIds: trackerId },
      } as unknown as Record<string, unknown>
    );

    return { success: true };
  }
}
