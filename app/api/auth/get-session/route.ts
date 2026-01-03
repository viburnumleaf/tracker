import { getAuth } from "@/src/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return Response.json(session);
}

