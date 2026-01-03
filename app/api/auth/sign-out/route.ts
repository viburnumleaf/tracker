import { getAuth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    // Use better-auth API directly to sign out
    await auth.api.signOut({
      headers: request.headers,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    // Even if there's an error, try to clear the session
    return NextResponse.json(
      { error: "Failed to sign out", success: false },
      { status: 500 }
    );
  }
}

