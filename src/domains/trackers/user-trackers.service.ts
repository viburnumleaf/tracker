import { db } from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const updateTrackersOrderSchema = z.object({
  trackerIds: z.array(z.string()),
});

export type UpdateTrackersOrderDto = z.infer<typeof updateTrackersOrderSchema>;

export class UserTrackersService {
  /**
   * Get user's tracker IDs
   */
  async getUserTrackerIds(userId: string) {
    const database = await db();
    const userTracker = await database.collection("user_trackers").findOne({
      userId,
    });

    return userTracker?.trackerIds || [];
  }

  /**
   * Update user's tracker order
   */
  async updateTrackersOrder(userId: string, data: UpdateTrackersOrderDto) {
    const database = await db();

    // Verify all tracker IDs are valid ObjectIds
    try {
      data.trackerIds.forEach((id) => new ObjectId(id));
    } catch (error) {
      throw new Error("Invalid tracker ID format");
    }

    // Verify all trackers exist
    const objectIds = data.trackerIds.map((id) => new ObjectId(id));
    const trackers = await database
      .collection("trackers")
      .find({ _id: { $in: objectIds } })
      .toArray();

    if (trackers.length !== data.trackerIds.length) {
      throw new Error("Some tracker IDs are invalid");
    }

    // Verify user has access to all trackers
    const userTracker = await database.collection("user_trackers").findOne({
      userId,
    });

    const userTrackerIds = userTracker?.trackerIds || [];
    const hasAllTrackers = data.trackerIds.every((id) =>
      userTrackerIds.includes(id)
    );

    if (!hasAllTrackers) {
      throw new Error("You don't have access to some of these trackers");
    }

    // Update user's tracker order
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $set: { trackerIds: data.trackerIds },
        $setOnInsert: { deletedTrackerIds: [] },
      },
      { upsert: true }
    );

    return data.trackerIds;
  }

  /**
   * Add tracker to user's list
   */
  async addTrackerToUser(userId: string, trackerId: string) {
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

    // Add tracker to user's list
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $setOnInsert: { userId, trackerIds: [], deletedTrackerIds: [] },
        $addToSet: { trackerIds: trackerId },
        $pull: { deletedTrackerIds: trackerId }, // Remove from deleted if it was there
      } as unknown as Record<string, unknown>,
      { upsert: true }
    );

    return { success: true };
  }

  /**
   * Remove tracker from user's list
   */
  async removeTrackerFromUser(userId: string, trackerId: string) {
    const database = await db();

    // Remove tracker from user's list
    await database.collection("user_trackers").updateOne(
      { userId },
      {
        $pull: { trackerIds: trackerId },
      } as unknown as Record<string, unknown>
    );

    return { success: true };
  }
}
