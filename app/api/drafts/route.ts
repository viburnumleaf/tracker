import { withAuth } from "@/src/lib/api-handler";
import {
  getDraftEntries,
  createDraftEntry,
} from "@/src/domains/drafts/draft-entries.controller";

export const GET = withAuth(async (userId) => getDraftEntries(userId));

export const POST = withAuth(async (userId, request) =>
  createDraftEntry(userId, request)
);
