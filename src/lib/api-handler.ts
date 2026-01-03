import { NextResponse } from "next/server";
import { requireAuth, requireAuthWithEmail } from "./auth-guard";

/**
 * Helper to handle errors that might be Response objects
 */
function handleError(error: unknown): Response {
  if (error instanceof Response) {
    return error;
  }
  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Wrapper for handlers that require authentication
 */
export function withAuth(
  handler: (userId: string, request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const userId = await requireAuth(request);
      return await handler(userId, request);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Wrapper for handlers with params that require authentication
 */
export function withAuthParams<T extends Record<string, string>>(
  handler: (
    userId: string,
    request: Request,
    params: T
  ) => Promise<Response>
) {
  return async (
    request: Request,
    context: { params: Promise<T> }
  ): Promise<Response> => {
    try {
      const userId = await requireAuth(request);
      const params = await context.params;
      return await handler(userId, request, params);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Wrapper for handlers that require authentication with email
 */
export function withAuthEmail(
  handler: (userId: string, email: string, request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const { userId, email } = await requireAuthWithEmail(request);
      return await handler(userId, email, request);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Simple wrapper for handlers that don't require auth
 */
export function withHandler(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}
