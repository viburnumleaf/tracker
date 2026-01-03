import { getAuth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";

export class AuthService {
  /**
   * Get current session
   */
  async getSession(request: Request) {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return session;
  }

  /**
   * Sign out user
   */
  async signOut(request: Request) {
    const auth = await getAuth();
    await auth.api.signOut({
      headers: request.headers,
    });

    return { success: true };
  }

  /**
   * Get user data by email from session
   */
  async getUserByEmail(email: string) {
    const database = await db();
    // Better Auth uses "user" collection by default (singular)
    const userData = await database.collection("user").findOne({
      email,
    });

    if (!userData) {
      throw new Error("User not found");
    }

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = userData;

    return userWithoutPassword;
  }
}
