import { AxiosResponse } from "axios";
import { apiClient } from "@/src/api/client";

export type DraftEntry = {
  _id: string;
  userId: string;
  trackerId: string;
  data: Record<string, unknown>;
  customEnumValues?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export type CreateDraftEntryRequest = {
  trackerId: string;
  data: Record<string, unknown>;
  customEnumValues?: Record<string, string[]>;
}

export type UpdateDraftEntryRequest = {
  trackerId: string;
  data: Record<string, unknown>;
  customEnumValues?: Record<string, string[]>;
}

// Drafts API methods
export const draftsApi = {
  // Get all draft entries for the current user
  getDrafts: async (): Promise<DraftEntry[]> => {
    const response: AxiosResponse<DraftEntry[]> = await apiClient.get("/api/drafts");
    return response.data;
  },

  // Get a single draft entry
  getDraft: async (draftId: string): Promise<DraftEntry> => {
    const response: AxiosResponse<DraftEntry> = await apiClient.get(
      `/api/drafts/${draftId}`
    );
    return response.data;
  },

  // Create a new draft entry
  createDraft: async (draft: CreateDraftEntryRequest): Promise<DraftEntry> => {
    const response: AxiosResponse<DraftEntry> = await apiClient.post(
      "/api/drafts",
      draft
    );
    return response.data;
  },

  // Update a draft entry
  updateDraft: async (
    draftId: string,
    draft: UpdateDraftEntryRequest
  ): Promise<DraftEntry> => {
    const response: AxiosResponse<DraftEntry> = await apiClient.put(
      `/api/drafts/${draftId}`,
      draft
    );
    return response.data;
  },

  // Delete a draft entry
  deleteDraft: async (draftId: string): Promise<void> => {
    await apiClient.delete(`/api/drafts/${draftId}`);
  },
};
