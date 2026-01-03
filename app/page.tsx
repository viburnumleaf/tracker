"use client";
import { useAuth } from "@/src/features/auth/hooks";
import { redirect } from "next/navigation";

export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return redirect("/dashboard");
  }
  return redirect("/login");
}
