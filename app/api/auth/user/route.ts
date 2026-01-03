import { withAuthEmail } from "@/src/lib/api-handler";
import { getUser } from "@/src/domains/auth/auth.controller";

export const GET = withAuthEmail(async (_userId, email, _request) => getUser(email));

