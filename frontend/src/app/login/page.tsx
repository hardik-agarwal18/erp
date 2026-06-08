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
  const [isDemoLoading, setIsDemoLoading] = useState(false);
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

  const handleDemoLogin = async () => {
    try {
      setError(null);
      setIsDemoLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/demo/seed`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to provision demo environment");
      const { data } = await res.json();
      await signIn({ email: data.email, password: data.password });
      router.replace(nextPath);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to generate demo");
      setIsDemoLoading(false);
    }
  };

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
              <Input id="email" type="email" {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" } })} />
              {formState.errors.email && <p className="text-sm text-rose-600">{formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password", { required: "Password is required" })} />
              {formState.errors.password && <p className="text-sm text-rose-600">{formState.errors.password.message}</p>}
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" disabled={formState.isSubmitting || isDemoLoading} type="submit">
              {formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 text-sm text-slate-500">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={handleDemoLogin} 
            disabled={isDemoLoading || formState.isSubmitting}
          >
            {isDemoLoading ? "Provisioning your demo workspace..." : "Try Interactive Demo"}
          </Button>


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
