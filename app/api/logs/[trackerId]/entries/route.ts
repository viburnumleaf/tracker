import { withAuthParams } from "@/src/lib/api-handler";
import {
  getLogEntries,
  createLogEntry,
  deleteLogEntry,
  permanentlyDeleteLogEntry,
} from "@/src/domains/logs/log-entries.controller";
import { NextResponse } from "next/server";

export const GET = withAuthParams(async (userId, request, { trackerId }) =>
  getLogEntries(userId, trackerId, request)
);

export const POST = withAuthParams(async (userId, request, { trackerId }) =>
  createLogEntry(userId, trackerId, request)
);

export const DELETE = withAuthParams(async (userId, request, { trackerId }) => {
  const { searchParams } = new URL(request.url);
  const logEntryId = searchParams.get("logEntryId");
  const permanent = searchParams.get("permanent") === "true";
  
  if (!logEntryId) {
    return NextResponse.json({ error: "logEntryId is required" }, {
      status: 400,
    });
  }
  
  if (permanent) {
    const { permanentlyDeleteLogEntry } = await import("@/src/domains/logs/log-entries.controller");
    return permanentlyDeleteLogEntry(userId, logEntryId);
  }
  
  return deleteLogEntry(userId, logEntryId);
});
