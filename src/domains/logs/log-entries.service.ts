import { db } from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { JsonSchema, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { validateAgainstSchema } from "@/src/lib/schema-validator";

export const createLogEntrySchema = z.object({
  data: z.record(z.string(), z.unknown()),
  customEnumValues: z.record(z.string(), z.array(z.string())).optional(),
  createdAt: z.string().optional(),
});

export type CreateLogEntryDto = z.infer<typeof createLogEntrySchema>;

/**
 * Оновлює схему трекера, додаючи нові enum значення з customEnumValues
 */
function updateTrackerSchemaWithCustomEnums(
  schema: JsonSchema,
  customEnumValues?: Record<string, string[]>
): JsonSchema {
  if (!customEnumValues || Object.keys(customEnumValues).length === 0) {
    return schema;
  }

  const updatedProperties: Record<string, JsonSchemaProperty> = {
    ...schema.properties,
  };

  // Функція для оновлення enum значень у властивості
  const updatePropertyEnums = (
    prop: JsonSchemaProperty,
    fieldKey: string
  ): JsonSchemaProperty => {
    const updatedProp = { ...prop };

    // Оновлюємо enum для поточного поля, якщо є customEnumValues
    if (prop.enum && customEnumValues[fieldKey] && customEnumValues[fieldKey].length > 0) {
      const existingEnum = prop.enum || [];
      const customEnum = customEnumValues[fieldKey] || [];
      // Об'єднуємо масиви, прибираючи дублікати
      updatedProp.enum = Array.from(new Set([...existingEnum, ...customEnum]));
    }

    // Рекурсивно оновлюємо вкладені об'єкти
    if (prop.properties) {
      updatedProp.properties = {};
      for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
        const nestedFieldKey = `${fieldKey}.${nestedKey}`;
        updatedProp.properties[nestedKey] = updatePropertyEnums(
          nestedProp,
          nestedFieldKey
        );
      }
    }

    // Оновлюємо items для масивів
    if (prop.items) {
      const itemsFieldKey = `${fieldKey}[]`;
      updatedProp.items = updatePropertyEnums(prop.items, itemsFieldKey);
    }

    return updatedProp;
  };

  // Оновлюємо всі поля
  for (const [fieldKey, prop] of Object.entries(schema.properties)) {
    updatedProperties[fieldKey] = updatePropertyEnums(prop, fieldKey);
  }

  return {
    ...schema,
    properties: updatedProperties,
  };
}

export class LogEntriesService {
  /**
   * Get log entries for a tracker
   */
  async getLogEntries(
    userId: string,
    trackerId: string,
    includeDeleted: boolean = false,
    limit?: number,
    skip?: number
  ) {
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

    // In admin mode, skip user access check
    if (!includeDeleted) {
      // Verify user has access to this tracker
      const userTracker = await database.collection("user_trackers").findOne({
        userId,
        trackerIds: trackerId,
      });

      if (!userTracker) {
        throw new Error("Tracker not found");
      }
    }

    // Build query
    const query: Record<string, unknown> = {
      trackerId: trackerId,
      userId,
    };

    if (!includeDeleted) {
      query.deletedAt = { $exists: false };
    }

    // Build cursor with pagination
    let cursor = database
      .collection("logs")
      .find(query)
      .sort({ createdAt: -1 });

    // Apply pagination if provided
    if (skip !== undefined && skip > 0) {
      cursor = cursor.skip(skip);
    }
    if (limit !== undefined && limit > 0) {
      cursor = cursor.limit(limit);
    }

    // Get entries from single logs collection
    const entries = await cursor.toArray();

    // Mark deleted entries
    if (includeDeleted) {
      return entries.map((entry) => ({
        ...entry,
        isDeleted: !!entry.deletedAt,
      }));
    }

    return entries;
  }

  /**
   * Create a new log entry
   */
  async createLogEntry(
    userId: string,
    trackerId: string,
    data: CreateLogEntryDto
  ) {
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

    // Validate data against schema
    const trackerSchema = tracker.schema as JsonSchema;

    // Debug: log schema to check if createLinkedLog is present
    console.log(
      `[LinkedLog] Tracker schema for ${tracker.name}:`,
      JSON.stringify(trackerSchema.properties, null, 2)
    );

    const validation = validateAgainstSchema(trackerSchema, data.data, data.customEnumValues);

    if (!validation.isValid) {
      const errorMessage = `Validation failed: ${validation.errors.join("; ")}`;
      const error = new Error(errorMessage) as Error & {
        fieldErrors?: Record<string, string[]>;
      };
      error.fieldErrors = validation.fieldErrors;
      throw error;
    }

    // Оновлюємо схему трекера з новими enum значеннями
    if (data.customEnumValues && Object.keys(data.customEnumValues).length > 0) {
      const updatedSchema = updateTrackerSchemaWithCustomEnums(
        trackerSchema,
        data.customEnumValues
      );

      // Перевіряємо, чи є зміни в схемі
      const schemaChanged = JSON.stringify(trackerSchema) !== JSON.stringify(updatedSchema);

      if (schemaChanged) {
        const schemaUpdateTime = new Date().toISOString();
        await database.collection("trackers").updateOne(
          { _id: new ObjectId(trackerId) },
          {
            $set: {
              schema: updatedSchema,
              updatedAt: schemaUpdateTime,
            },
          }
        );
        // Оновлюємо локальну копію схеми для подальшої обробки
        tracker.schema = updatedSchema;
      }
    }

    const now = new Date().toISOString();

    const entry = {
      trackerId: trackerId,
      userId,
      data: data.data,
      createdAt: data.createdAt || now,
    };

    // Create indexes for logs collection if they don't exist
    const logsCollection = database.collection("logs");
    await logsCollection.createIndex({
      userId: 1,
      trackerId: 1,
      createdAt: -1,
    });

    const result = await logsCollection.insertOne(entry);

    // Check for linked logs configuration and create them if needed
    const createdLinkedLogs: string[] = [];
    
    // First, identify fields that have nested objects with dependsOn (new way)
    // to avoid processing them with the old way
    const fieldsWithNestedObjects = new Set<string>();
    if (trackerSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(
        trackerSchema.properties
      )) {
        if (fieldSchema.type === "object" && fieldSchema.dependsOn) {
          const dependsOnProp = trackerSchema.properties?.[fieldSchema.dependsOn];
          if (dependsOnProp?.createLinkedLog) {
            fieldsWithNestedObjects.add(fieldSchema.dependsOn);
          }
        }
      }
    }
    
    if (trackerSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(
        trackerSchema.properties
      )) {
        // Check if this field has createLinkedLog configuration (old way)
        // Skip if this field has a corresponding nested object (new way takes precedence)
        if (fieldSchema.createLinkedLog && !fieldsWithNestedObjects.has(fieldName)) {
          const fieldValue = data.data[fieldName];

          // If field is boolean and true, or if field exists and is truthy
          if (fieldValue === true || (fieldValue && fieldValue !== false)) {
            const linkedConfig = fieldSchema.createLinkedLog;
            const normalizedTrackerName = linkedConfig.trackerName
              .toLowerCase()
              .replace(/\s+/g, "_");

            console.log(
              `[LinkedLog] Field ${fieldName} is true, looking for tracker: ${normalizedTrackerName}`
            );

            // Find the linked tracker by name
            let linkedTracker = await database.collection("trackers").findOne({
              name: normalizedTrackerName,
            });

            // If not found, try case-insensitive search
            if (!linkedTracker) {
              const allTrackers = await database
                .collection("trackers")
                .find({})
                .toArray();
              linkedTracker =
                allTrackers.find(
                  (t) =>
                    t.name.toLowerCase().replace(/\s+/g, "_") ===
                    normalizedTrackerName
                ) || null;
            }

            if (!linkedTracker) {
              console.error(
                `[LinkedLog] Tracker "${normalizedTrackerName}" not found`
              );
              continue;
            }

            // Verify user has access to linked tracker
            const userHasAccess = await database
              .collection("user_trackers")
              .findOne({
                userId,
                trackerIds: linkedTracker._id.toString(),
              });

            if (!userHasAccess) {
              console.error(
                `[LinkedLog] User ${userId} does not have access to tracker ${linkedTracker._id.toString()}`
              );
              continue;
            }

            // Build data for linked log
            const linkedData: Record<string, unknown> = {};
            const linkedSchema = linkedTracker.schema as JsonSchema;

            if (linkedConfig.dataMapping) {
              // Map fields according to configuration
              for (const [targetField, sourceField] of Object.entries(
                linkedConfig.dataMapping
              )) {
                const sourceValue = data.data[sourceField as string];
                linkedData[targetField] =
                  sourceValue !== undefined
                    ? sourceValue
                    : new Date().toISOString();
              }
            }

            // Fill in any required fields that weren't mapped
            if (linkedSchema.properties) {
              for (const [linkedFieldName, linkedFieldSchema] of Object.entries(
                linkedSchema.properties
              )) {
                if (!linkedData[linkedFieldName]) {
                  if (
                    linkedFieldSchema.format === "date-time" ||
                    linkedFieldName.toLowerCase().includes("time")
                  ) {
                    linkedData[linkedFieldName] =
                      linkedConfig.useCurrentTime !== false
                        ? new Date().toISOString()
                        : data.data[linkedFieldName] ||
                          new Date().toISOString();
                  }
                }
              }
            }

            // Validate linked data against linked tracker schema
            const linkedValidation = validateAgainstSchema(
              linkedTracker.schema as JsonSchema,
              linkedData,
              undefined // Linked logs don't have custom enum values
            );

            if (!linkedValidation.isValid) {
              console.error(
                `[LinkedLog] Validation failed:`,
                linkedValidation.errors
              );
              continue;
            }

            // Create linked log entry
            const linkedEntry = {
              trackerId: linkedTracker._id.toString(),
              userId,
              data: linkedData,
              createdAt: now,
              linkedFromLogId: result.insertedId.toString(),
            };

            const linkedResult = await logsCollection.insertOne(linkedEntry);
            createdLinkedLogs.push(linkedResult.insertedId.toString());
            console.log(
              `[LinkedLog] Successfully created linked log: ${linkedResult.insertedId.toString()}`
            );
          }
        }

        // Check for nested objects that represent linked trackers (new way)
        // Pattern: if field is an object with dependsOn, check if the dependsOn field
        // has createLinkedLog configuration, and create a linked log using nested object data
        if (
          fieldSchema.type === "object" &&
          fieldSchema.dependsOn
        ) {
          const dependsOnValue = data.data[fieldSchema.dependsOn];
          const nestedObjectData = data.data[fieldName] as
            | Record<string, unknown>
            | undefined;

          // If the dependsOn field is true and nested object exists
          if (
            dependsOnValue === true &&
            nestedObjectData &&
            typeof nestedObjectData === "object"
          ) {
            // Get the dependsOn field schema to check for createLinkedLog
            const dependsOnProp = trackerSchema.properties?.[fieldSchema.dependsOn];
            const linkedConfig = dependsOnProp?.createLinkedLog;

            if (linkedConfig) {
              // Use trackerName from createLinkedLog configuration
              const normalizedTrackerName = linkedConfig.trackerName
                .toLowerCase()
                .replace(/\s+/g, "_");

              console.log(
                `[LinkedLog] Nested object ${fieldName} depends on ${fieldSchema.dependsOn}, looking for tracker: ${normalizedTrackerName}`
              );

              // Find the linked tracker by name
              let linkedTracker = await database.collection("trackers").findOne({
                name: normalizedTrackerName,
              });

              // If not found, try case-insensitive search
              if (!linkedTracker) {
                const allTrackers = await database
                  .collection("trackers")
                  .find({})
                  .toArray();
                linkedTracker =
                  allTrackers.find(
                    (t) =>
                      t.name.toLowerCase().replace(/\s+/g, "_") ===
                      normalizedTrackerName
                  ) || null;
              }

              if (!linkedTracker) {
                console.error(
                  `[LinkedLog] Tracker "${normalizedTrackerName}" not found for nested object ${fieldName}`
                );
                continue;
              }

              // Verify user has access to linked tracker
              const userHasAccess = await database
                .collection("user_trackers")
                .findOne({
                  userId,
                  trackerIds: linkedTracker._id.toString(),
                });

              if (!userHasAccess) {
                console.error(
                  `[LinkedLog] User ${userId} does not have access to tracker ${linkedTracker._id.toString()} for nested object ${fieldName}`
                );
                continue;
              }

              // Build data for linked log from nested object
              const linkedData: Record<string, unknown> = {};
              const linkedSchema = linkedTracker.schema as JsonSchema;

              // First, use nested object data directly
              Object.assign(linkedData, nestedObjectData);

              // Apply dataMapping if configured (maps fields from parent form to nested object)
              if (linkedConfig.dataMapping) {
                for (const [targetField, sourceField] of Object.entries(
                  linkedConfig.dataMapping
                )) {
                  // dataMapping maps from parent form fields to nested object fields
                  const sourceValue = data.data[sourceField as string];
                  if (sourceValue !== undefined) {
                    linkedData[targetField] = sourceValue;
                  }
                }
              }

              // Fill in any required fields that weren't mapped or provided
              if (linkedSchema.properties) {
                for (const [linkedFieldName, linkedFieldSchema] of Object.entries(
                  linkedSchema.properties
                )) {
                  if (!linkedData[linkedFieldName]) {
                    if (
                      linkedFieldSchema.format === "date-time" ||
                      linkedFieldName.toLowerCase().includes("time")
                    ) {
                      linkedData[linkedFieldName] =
                        linkedConfig.useCurrentTime !== false
                          ? new Date().toISOString()
                          : new Date().toISOString();
                    }
                  }
                }
              }

              // Validate linked data against linked tracker schema
              const linkedValidation = validateAgainstSchema(
                linkedTracker.schema as JsonSchema,
                linkedData,
                undefined // Linked logs don't have custom enum values
              );

              if (!linkedValidation.isValid) {
                console.error(
                  `[LinkedLog] Validation failed for nested object ${fieldName}:`,
                  linkedValidation.errors
                );
                continue;
              }

              // Create linked log entry
              const linkedEntry = {
                trackerId: linkedTracker._id.toString(),
                userId,
                data: linkedData,
                createdAt: now,
                linkedFromLogId: result.insertedId.toString(),
              };

              const linkedResult = await logsCollection.insertOne(linkedEntry);
              createdLinkedLogs.push(linkedResult.insertedId.toString());
              console.log(
                `[LinkedLog] Successfully created linked log from nested object ${fieldName}: ${linkedResult.insertedId.toString()}`
              );
            } else {
              // Fallback: Try to find a tracker with a name matching the field name
              // This is for backward compatibility
              const normalizedFieldName = fieldName
                .toLowerCase()
                .replace(/log$/, "")
                .replace(/\s+/g, "_");

              let linkedTracker = await database.collection("trackers").findOne({
                name: normalizedFieldName,
              });

              if (!linkedTracker) {
                const allTrackers = await database
                  .collection("trackers")
                  .find({})
                  .toArray();
                linkedTracker =
                  allTrackers.find(
                    (t) =>
                      t.name.toLowerCase().replace(/\s+/g, "_") ===
                      normalizedFieldName
                  ) || null;
              }

              if (linkedTracker) {
                const userHasAccess = await database
                  .collection("user_trackers")
                  .findOne({
                    userId,
                    trackerIds: linkedTracker._id.toString(),
                  });

                if (userHasAccess) {
                  const linkedData = { ...nestedObjectData };
                  const linkedValidation = validateAgainstSchema(
                    linkedTracker.schema as JsonSchema,
                    linkedData
                  );

                  if (linkedValidation.isValid) {
                    const linkedEntry = {
                      trackerId: linkedTracker._id.toString(),
                      userId,
                      data: linkedData,
                      createdAt: now,
                      linkedFromLogId: result.insertedId.toString(),
                    };

                    const linkedResult = await logsCollection.insertOne(
                      linkedEntry
                    );
                    createdLinkedLogs.push(linkedResult.insertedId.toString());
                    console.log(
                      `[LinkedLog] Successfully created linked log from nested object ${fieldName} (fallback): ${linkedResult.insertedId.toString()}`
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      _id: result.insertedId.toString(),
      ...entry,
      createdLinkedLogs, // Return IDs of created linked logs
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

  /**
   * Permanently delete a log entry (admin only)
   */
  async permanentlyDeleteLogEntry(logEntryId: string) {
    const database = await db();

    // Verify log entry exists
    let logEntry;
    try {
      logEntry = await database.collection("logs").findOne({
        _id: new ObjectId(logEntryId),
      });
    } catch (error) {
      throw new Error("Invalid log entry ID");
    }

    if (!logEntry) {
      throw new Error("Log entry not found");
    }

    // Permanently delete the log entry
    await database.collection("logs").deleteOne({
      _id: new ObjectId(logEntryId),
    });

    return { success: true };
  }
}
