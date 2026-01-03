import { AxiosResponse } from "axios";
import { apiClient } from "@/src/api/client";

// JSON Schema types for tracker field definitions
export interface JsonSchemaProperty {
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
}

export interface JsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface Tracker {
  _id: string;
  name: string;
  schema: JsonSchema;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackerRequest {
  name: string;
  schema: JsonSchema;
}

export interface LogEntry {
  _id: string;
  trackerId: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface CreateLogEntryRequest {
  trackerId: string;
  data: Record<string, unknown>;
}

// Trackers API methods
export const trackersApi = {
  // Get all trackers for the current user
  getTrackers: async (): Promise<Tracker[]> => {
    const response: AxiosResponse<Tracker[]> = await apiClient.get("/api/logs");
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

  // Get log entries for a tracker
  getLogEntries: async (trackerId: string): Promise<LogEntry[]> => {
    const response: AxiosResponse<LogEntry[]> = await apiClient.get(
      `/api/logs/${trackerId}/entries`
    );
    return response.data;
  },

  // Create a log entry for a tracker
  createLogEntry: async (
    entry: CreateLogEntryRequest
  ): Promise<LogEntry> => {
    const response: AxiosResponse<LogEntry> = await apiClient.post(
      `/api/logs/${entry.trackerId}/entries`,
      { data: entry.data }
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
};
