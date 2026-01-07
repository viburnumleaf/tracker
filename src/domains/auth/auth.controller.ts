import { NextResponse } from "next/server";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export const getSession = async (request: Request) => {
  try {
    const session = await authService.getSession(request);
    return Response.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const signOut = async (request: Request) => {
  try {
    const result = await authService.signOut(request);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sign out error:", error);
    // Even if there's an error, try to clear the session
    return NextResponse.json(
      { error: "Failed to sign out", success: false },
      { status: 500 }
    );
  }
}

export const getUser = async (email: string) => {
  try {
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await authService.getUserByEmail(email);
    return NextResponse.json(userData);
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
