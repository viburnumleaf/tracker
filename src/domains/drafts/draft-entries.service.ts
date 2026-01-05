import { db } from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const createDraftEntrySchema = z.object({
  trackerId: z.string(),
  data: z.record(z.string(), z.unknown()),
  customEnumValues: z.record(z.string(), z.array(z.string())).optional(),
});

export type CreateDraftEntryDto = z.infer<typeof createDraftEntrySchema>;

export interface DraftEntry {
  _id: string;
  userId: string;
  trackerId: string;
  data: Record<string, unknown>;
  customEnumValues?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export class DraftEntriesService {
  /**
   * Get all draft entries for a user
   */
  async getDraftEntries(userId: string) {
    const database = await db();

    const entries = await database
      .collection("draft_entries")
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return entries.map((entry) => ({
      _id: entry._id.toString(),
      userId: entry.userId,
      trackerId: entry.trackerId,
      data: entry.data,
      customEnumValues: entry.customEnumValues,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }

  /**
   * Get a single draft entry
   */
  async getDraftEntry(userId: string, draftId: string): Promise<DraftEntry> {
    const database = await db();

    let draft;
    try {
      draft = await database.collection("draft_entries").findOne({
        _id: new ObjectId(draftId),
        userId,
      });
    } catch (error) {
      throw new Error("Invalid draft ID");
    }

    if (!draft) {
      throw new Error("Draft not found");
    }

    return {
      _id: draft._id.toString(),
      userId: draft.userId,
      trackerId: draft.trackerId,
      data: draft.data,
      customEnumValues: draft.customEnumValues,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }

  /**
   * Create a new draft entry
   */
  async createDraftEntry(userId: string, data: CreateDraftEntryDto): Promise<DraftEntry> {
    const database = await db();

    // Verify tracker exists
    let tracker;
    try {
      tracker = await database.collection("trackers").findOne({
        _id: new ObjectId(data.trackerId),
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
      trackerIds: data.trackerId,
    });

    if (!userTracker) {
      throw new Error("Tracker not found");
    }

    const now = new Date().toISOString();

    const draft = {
      userId,
      trackerId: data.trackerId,
      data: data.data,
      customEnumValues: data.customEnumValues || {},
      createdAt: now,
      updatedAt: now,
    };

    // Create indexes for draft_entries collection if they don't exist
    const draftsCollection = database.collection("draft_entries");
    await draftsCollection.createIndex({
      userId: 1,
      updatedAt: -1,
    });
    await draftsCollection.createIndex({
      userId: 1,
      trackerId: 1,
    });

    const result = await draftsCollection.insertOne(draft);

    return {
      _id: result.insertedId.toString(),
      userId: draft.userId,
      trackerId: draft.trackerId,
      data: draft.data,
      customEnumValues: draft.customEnumValues,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }

  /**
   * Update a draft entry
   */
  async updateDraftEntry(
    userId: string,
    draftId: string,
    data: CreateDraftEntryDto
  ): Promise<DraftEntry> {
    const database = await db();

    // Verify draft exists and belongs to user
    let draft;
    try {
      draft = await database.collection("draft_entries").findOne({
        _id: new ObjectId(draftId),
        userId,
      });
    } catch (error) {
      throw new Error("Invalid draft ID");
    }

    if (!draft) {
      throw new Error("Draft not found");
    }

    // Verify tracker exists if trackerId changed
    if (data.trackerId !== draft.trackerId) {
      let tracker;
      try {
        tracker = await database.collection("trackers").findOne({
          _id: new ObjectId(data.trackerId),
        });
      } catch (error) {
        throw new Error("Invalid tracker ID");
      }

      if (!tracker) {
        throw new Error("Tracker not found");
      }

      // Verify user has access to new tracker
      const userTracker = await database.collection("user_trackers").findOne({
        userId,
        trackerIds: data.trackerId,
      });

      if (!userTracker) {
        throw new Error("Tracker not found");
      }
    }

    const now = new Date().toISOString();

    await database.collection("draft_entries").updateOne(
      { _id: new ObjectId(draftId), userId },
      {
        $set: {
          trackerId: data.trackerId,
          data: data.data,
          customEnumValues: data.customEnumValues || {},
          updatedAt: now,
        },
      }
    );

    return this.getDraftEntry(userId, draftId);
  }

  /**
   * Delete a draft entry
   */
  async deleteDraftEntry(userId: string, draftId: string): Promise<void> {
    const database = await db();

    let draft;
    try {
      draft = await database.collection("draft_entries").findOne({
        _id: new ObjectId(draftId),
        userId,
      });
    } catch (error) {
      throw new Error("Invalid draft ID");
    }

    if (!draft) {
      throw new Error("Draft not found");
    }

    await database.collection("draft_entries").deleteOne({
      _id: new ObjectId(draftId),
      userId,
    });
  }
}
