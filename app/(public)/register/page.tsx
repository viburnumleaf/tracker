"use client";

import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useRegister } from "@/src/features/auth/hooks";
import { registerSchema, type RegisterFormData } from "@/src/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const registerMutation = useRegister();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as RegisterFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = registerSchema.safeParse(value);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof RegisterFormData;
            if (field) {
              form.setFieldMeta(field, (prev) => ({
                ...prev,
                errorMap: {
                  ...prev.errorMap,
                  onSubmit: issue.message,
                },
              }));
            }
          });
          return "Validation failed";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      registerMutation.mutate(
        {
          email: value.email,
          password: value.password,
          name: value.name.trim(),
        },
        {
          onError: (error: Error) => {
            form.setFieldMeta("email", (prev) => ({
              ...prev,
              errorMap: {
                ...prev.errorMap,
                onSubmit: error.message || "Registration failed",
              },
            }));
          },
        }
      );
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold">
              Registration
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Name"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Email address"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Password"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Confirm Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirm Password"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || registerMutation.isPending}
                  className="w-full"
                >
                  {isSubmitting || registerMutation.isPending
                    ? "Registration..."
                    : "Register"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </Card>
    </div>
  );
}

