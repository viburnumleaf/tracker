"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@/src/features/auth/hooks";
import { useLogout } from "@/src/features/auth/hooks";

export const DashboardHeader = () => {
  const { user } = useUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
          onClick={handleLogout}
          variant="destructive"
          disabled={logoutMutation.isPending}
          className="cursor-pointer"
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
      {user && (
        <div className="space-y-2">
          <p className="text-muted-foreground">Welcome back!</p>
          <p className="font-medium">User: {user.email || "Unknown"}</p>
        </div>
      )}
    </Card>
  );
}
