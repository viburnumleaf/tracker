import { withHandler } from "@/src/lib/api-handler";
import { getSession } from "@/src/domains/auth/auth.controller";

export const GET = withHandler((request) => getSession(request));

