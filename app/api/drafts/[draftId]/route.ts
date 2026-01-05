import { withAuthParams } from "@/src/lib/api-handler";
import {
  getDraftEntry,
  updateDraftEntry,
  deleteDraftEntry,
} from "@/src/domains/drafts/draft-entries.controller";

export const GET = withAuthParams(
  async (userId, request, { draftId }) => getDraftEntry(userId, draftId)
);

export const PUT = withAuthParams(
  async (userId, request, { draftId }) => updateDraftEntry(userId, draftId, request)
);

export const DELETE = withAuthParams(
  async (userId, request, { draftId }) => deleteDraftEntry(userId, draftId)
);
