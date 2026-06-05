"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/hooks/use-workspace";

type LoginFormValues = {
  email: string;
  password: string;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated, isLoading } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  return (
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use your verified account to access your organization workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              try {
                setError(null);
                await signIn(values);
                router.replace(nextPath);
              } catch (submissionError) {
                setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in");
              }
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password", { required: true })} />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" disabled={formState.isSubmitting} type="submit">
              {formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
            <Link className="hover:text-slate-950" href="/signup">
              Create account
            </Link>
            <Link className="hover:text-slate-950" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <Suspense fallback={<div>Loading sign in...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
