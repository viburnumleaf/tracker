import { db } from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const createLogEntrySchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type CreateLogEntryDto = z.infer<typeof createLogEntrySchema>;

export class LogEntriesService {
  /**
   * Get log entries for a tracker
   */
  async getLogEntries(userId: string, trackerId: string) {
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

    // Get entries from single logs collection (excluding deleted ones)
    const entries = await database
      .collection("logs")
      .find({ 
        trackerId: trackerId, 
        userId,
        deletedAt: { $exists: false }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return entries;
  }

  /**
   * Create a new log entry
   */
  async createLogEntry(userId: string, trackerId: string, data: CreateLogEntryDto) {
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

    // TODO: Validate data against schema (can use ajv or zod schema compilation)

    const now = new Date().toISOString();

    const entry = {
      trackerId: trackerId,
      userId,
      data: data.data,
      createdAt: now,
    };

    // Create indexes for logs collection if they don't exist
    const logsCollection = database.collection("logs");
    await logsCollection.createIndex({ userId: 1, trackerId: 1, createdAt: -1 });

    const result = await logsCollection.insertOne(entry);

    return {
      _id: result.insertedId.toString(),
      ...entry,
    };
  }

  /**
   * Soft delete a log entry (only author can delete)
   */
  async deleteLogEntry(userId: string, logEntryId: string) {
    const database = await db();

    // Verify log entry exists and belongs to user
    let logEntry;
    try {
      logEntry = await database.collection("logs").findOne({
        _id: new ObjectId(logEntryId),
        userId,
        deletedAt: { $exists: false },
      });
    } catch (error) {
      throw new Error("Invalid log entry ID");
    }

    if (!logEntry) {
      throw new Error("Log entry not found");
    }

    // Soft delete: add deletedAt field
    const now = new Date().toISOString();
    await database.collection("logs").updateOne(
      { _id: new ObjectId(logEntryId) },
      {
        $set: { deletedAt: now },
      }
    );

    return { success: true };
  }
}
