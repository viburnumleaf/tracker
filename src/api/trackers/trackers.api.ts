import { AxiosResponse } from "axios";
import { apiClient } from "@/src/api/client";

// JSON Schema types for tracker field definitions
export type JsonSchemaProperty = {
  type: "string" | "number" | "boolean" | "array" | "object";
  title?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  format?: "date-time" | "date" | "time";
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  // Dynamic form fields
  dynamicCount?: string; // Field name that determines the count of inputs to render
  inputType?: "checkbox" | "slider" | string; // Type of input to render
  fallbackInputType?: "checkbox" | "slider" | "number" | "text"; // Fallback if custom inputType is not registered
  dependsOn?: string; // Field name that this field depends on (field will only show if dependsOn field is truthy)
  // Linked logs configuration
  createLinkedLog?: {
    trackerName: string; // Name of the linked tracker to create log in
    dataMapping?: Record<string, string>; // Map fields from current log to linked log (targetField: sourceField)
    useCurrentTime?: boolean; // If true, use current time for time fields in linked log
  };
}

export type JsonSchema = {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export type Tracker = {
  _id: string;
  name: string;
  schema: JsonSchema;
  createdAt: string;
  updatedAt: string;
}

export type CreateTrackerRequest = {
  name: string;
  schema: JsonSchema;
}

export type UpdateTrackerRequest = {
  schema: JsonSchema;
}

export type LogEntry = {
  _id: string;
  trackerId: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export type CreateLogEntryRequest = {
  trackerId: string;
  data: Record<string, unknown>;
  customEnumValues?: Record<string, string[]>;
  createdAt?: string;
}

// Trackers API methods
export const trackersApi = {
  // Get all trackers for the current user
  getTrackers: async (includeDeleted: boolean = false): Promise<(Tracker & { isDeleted?: boolean })[]> => {
    const response: AxiosResponse<(Tracker & { isDeleted?: boolean })[]> = await apiClient.get(
      `/api/logs${includeDeleted ? "?includeDeleted=true" : ""}`
    );
    return response.data;
  },

  // Create a new tracker
  createTracker: async (
    tracker: CreateTrackerRequest
  ): Promise<Tracker> => {
    const response: AxiosResponse<Tracker> = await apiClient.post(
      "/api/logs",
      tracker
    );
    return response.data;
  },

  // Update a tracker schema
  updateTracker: async (
    trackerId: string,
    tracker: UpdateTrackerRequest
  ): Promise<Tracker> => {
    const response: AxiosResponse<Tracker> = await apiClient.put(
      `/api/logs?trackerId=${trackerId}`,
      tracker
    );
    return response.data;
  },

  // Get log entries for a tracker
  getLogEntries: async (
    trackerId: string,
    includeDeleted: boolean = false,
    limit?: number,
    skip?: number
  ): Promise<(LogEntry & { isDeleted?: boolean })[]> => {
    const params = new URLSearchParams();
    if (includeDeleted) params.append("includeDeleted", "true");
    if (limit !== undefined) params.append("limit", limit.toString());
    if (skip !== undefined) params.append("skip", skip.toString());
    
    const queryString = params.toString();
    const response: AxiosResponse<(LogEntry & { isDeleted?: boolean })[]> = await apiClient.get(
      `/api/logs/${trackerId}/entries${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  },

  // Create a log entry for a tracker
  createLogEntry: async (
    entry: CreateLogEntryRequest
  ): Promise<LogEntry> => {
    const response: AxiosResponse<LogEntry> = await apiClient.post(
      `/api/logs/${entry.trackerId}/entries`,
      { 
        data: entry.data,
        customEnumValues: entry.customEnumValues,
        createdAt: entry.createdAt
      }
    );
    return response.data;
  },

  // Delete a tracker
  deleteTracker: async (trackerId: string): Promise<void> => {
    await apiClient.delete(`/api/logs?trackerId=${trackerId}`);
  },

  // Delete a log entry
  deleteLogEntry: async (trackerId: string, logEntryId: string): Promise<void> => {
    await apiClient.delete(`/api/logs/${trackerId}/entries?logEntryId=${logEntryId}`);
  },

  // Permanently delete a tracker (admin only)
  permanentlyDeleteTracker: async (trackerId: string): Promise<void> => {
    await apiClient.delete(`/api/logs?trackerId=${trackerId}&permanent=true`);
  },

  // Permanently delete a log entry (admin only)
  permanentlyDeleteLogEntry: async (trackerId: string, logEntryId: string): Promise<void> => {
    await apiClient.delete(`/api/logs/${trackerId}/entries?logEntryId=${logEntryId}&permanent=true`);
  },

  // Update trackers order
  updateTrackersOrder: async (trackerIds: string[]): Promise<{ success: boolean; trackerIds: string[] }> => {
    const response: AxiosResponse<{ success: boolean; trackerIds: string[] }> = await apiClient.put(
      "/api/users/trackers",
      { trackerIds }
    );
    return response.data;
  },
};
