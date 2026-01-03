import { withHandler } from "@/src/lib/api-handler";
import { signOut } from "@/src/domains/auth/auth.controller";

export const POST = withHandler((request) => signOut(request));

