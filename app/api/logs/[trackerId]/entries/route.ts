import { withAuthParams } from "@/src/lib/api-handler";
import {
  getLogEntries,
  createLogEntry,
  deleteLogEntry,
} from "@/src/domains/logs/log-entries.controller";
import { NextResponse } from "next/server";

export const GET = withAuthParams(async (userId, _request, { trackerId }) =>
  getLogEntries(userId, trackerId)
);

export const POST = withAuthParams(async (userId, request, { trackerId }) =>
  createLogEntry(userId, trackerId, request)
);

export const DELETE = withAuthParams(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const logEntryId = searchParams.get("logEntryId");
  if (!logEntryId) {
    return NextResponse.json({ error: "logEntryId is required" }, {
      status: 400,
    });
  }
  return deleteLogEntry(userId, logEntryId);
});
