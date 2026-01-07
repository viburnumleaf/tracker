import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getAuthDb, getClient } from "./db";

// Initialize auth with MongoDB adapter
// We need to initialize it lazily since we need async db connection
let authInstance: ReturnType<typeof betterAuth> | null = null;
let authPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

const initAuth = async () => {
  if (authInstance) return authInstance;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const database = await getAuthDb();
    const client = await getClient();
    
    authInstance = betterAuth({
      database: mongodbAdapter(database, {
        client: client,
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
      },
    });
    return authInstance;
  })();

  return authPromise;
}

// Export auth with async getter
export const getAuth = initAuth;

// For route handlers that need auth, use getAuth()
// For type inference
export type Auth = Awaited<ReturnType<typeof getAuth>>;
export type Session = Awaited<ReturnType<typeof getAuth>>["$Infer"]["Session"];

