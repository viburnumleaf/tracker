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

// Schema for updating tracker (only schema field, name cannot be changed)
export const updateTrackerSchema = z.object({
  schema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()),
    required: z.array(z.string()).optional(),
  }),
});

export type UpdateTrackerDto = z.infer<typeof updateTrackerSchema>;

export class TrackersService {
  /**
   * Get all trackers for a user
   */
  async getUserTrackers(userId: string, includeDeleted: boolean = false) {
    const database = await db();

    // Get user's tracker IDs with order
    let userTracker = await database.collection("user_trackers").findOne({
      userId,
    });

    // If user_trackers record doesn't exist, create it with empty arrays
    if (!userTracker) {
      const insertResult = await database.collection("user_trackers").insertOne({
        userId,
        trackerIds: [],
        deletedTrackerIds: [],
      });
      userTracker = {
        _id: insertResult.insertedId,
        userId,
        trackerIds: [],
        deletedTrackerIds: [],
      };
    }

    const trackerIds = (userTracker?.trackerIds || []) as string[];
    const deletedTrackerIds = (userTracker?.deletedTrackerIds || []) as string[];

    // In admin mode, include deleted trackers
    const allTrackerIds = includeDeleted
      ? [...trackerIds, ...deletedTrackerIds]
      : trackerIds;

    if (allTrackerIds.length === 0) {
      return [];
    }

    // Convert string IDs to ObjectIds
    const objectIds = allTrackerIds.map((id: string) => new ObjectId(id));

    // Fetch trackers in the user's order
    const trackers = await database
      .collection("trackers")
      .find({ _id: { $in: objectIds } })
      .toArray();

    // Sort trackers according to user's order
    const trackersMap = new Map(trackers.map((t) => [t._id.toString(), t]));
    const orderedTrackers: typeof trackers = [];
    const deletedTrackerIdsSet = new Set(deletedTrackerIds);
    
    for (const id of allTrackerIds) {
      const tracker = trackersMap.get(id);
      if (tracker) {
        orderedTrackers.push({
          ...tracker,
          isDeleted: includeDeleted ? deletedTrackerIdsSet.has(id) : false,
        });
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
    // First, ensure user_trackers record exists
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $setOnInsert: { userId, trackerIds: [], deletedTrackerIds: [] },
      },
      { upsert: true }
    );

    // Then, add tracker to list and remove from deleted if it was there
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $addToSet: { trackerIds: trackerId },
        $pull: { deletedTrackerIds: trackerId }, // Remove from deleted if it was there
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
   * Update tracker schema (admin only - updates global tracker)
   */
  async updateTracker(userId: string, trackerId: string, data: UpdateTrackerDto) {
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

    // Verify user has access to this tracker (at least in their list)
    const userTracker = await database.collection("user_trackers").findOne({
      userId,
      $or: [
        { trackerIds: trackerId },
        { deletedTrackerIds: trackerId },
      ],
    });

    if (!userTracker) {
      throw new Error("Tracker not found");
    }

    // Update tracker schema (global update affects all users)
    const now = new Date().toISOString();
    await database.collection("trackers").updateOne(
      { _id: new ObjectId(trackerId) },
      {
        $set: {
          schema: data.schema,
          updatedAt: now,
        },
      }
    );

    // Fetch and return updated tracker
    const updatedTracker = await database.collection("trackers").findOne({
      _id: new ObjectId(trackerId),
    });

    if (!updatedTracker) {
      throw new Error("Tracker not found");
    }

    return {
      _id: updatedTracker._id.toString(),
      name: updatedTracker.name,
      schema: updatedTracker.schema,
      createdAt: updatedTracker.createdAt,
      updatedAt: updatedTracker.updatedAt,
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

    // Remove tracker from user's list and add to deleted list (soft delete for user)
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $pull: { trackerIds: trackerId },
        $addToSet: { deletedTrackerIds: trackerId },
      } as unknown as Record<string, unknown>
    );

    return { success: true };
  }

  /**
   * Permanently delete a tracker (admin only)
   */
  async permanentlyDeleteTracker(trackerId: string) {
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

    // Permanently delete the tracker
    await database.collection("trackers").deleteOne({
      _id: new ObjectId(trackerId),
    });

    // Also remove from all users' lists (both active and deleted)
    await database.collection("user_trackers").updateMany(
      {},
      {
        $pull: { trackerIds: trackerId, deletedTrackerIds: trackerId },
      } as unknown as Record<string, unknown>
    );

    // Also delete all log entries for this tracker
    await database.collection("logs").deleteMany({
      trackerId: trackerId,
    });

    return { success: true };
  }
}
