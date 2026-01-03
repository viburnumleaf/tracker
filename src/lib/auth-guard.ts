import { getAuth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get authenticated user ID from request
 * @returns userId or null if unauthorized
 */
export async function getUserId(request: Request): Promise<string | null> {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return session?.user?.id || null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get session from request
 */
export async function getSession(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Guard middleware - ensures user is authenticated
 * @returns userId or throws NextResponse with 401
 */
export async function requireAuth(request: Request): Promise<string> {
  const userId = await getUserId(request);

  if (!userId) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return userId;
}

/**
 * Guard middleware - ensures user is authenticated and has email
 * @returns { userId, email } or throws NextResponse with 401
 */
export async function requireAuthWithEmail(request: Request): Promise<{
  userId: string;
  email: string;
}> {
  const session = await getSession(request);

  if (!session?.user?.id || !session?.user?.email) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
