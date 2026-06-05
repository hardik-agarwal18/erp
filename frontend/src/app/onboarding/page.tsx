"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/hooks/use-workspace";
import { createOrganization } from "@/services/organization.service";
import { PageLoader } from "@/components/states/page-loader";

type OnboardingFormValues = {
  name: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { restoreSession, workspaces, isAuthenticated, isLoading } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<OnboardingFormValues>();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/onboarding");
    } else if (!isLoading && workspaces.length > 0) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, workspaces.length, router]);

  if (isLoading || !isAuthenticated || workspaces.length > 0) {
    return <PageLoader />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Welcome to your ERP!</CardTitle>
          <CardDescription>Let&apos;s create your first workspace to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              try {
                setError(null);
                await createOrganization({ name: values.name });
                await restoreSession(); // This will refresh the user's workspaces and active organization
                router.push("/dashboard");
              } catch (submissionError) {
                setError(submissionError instanceof Error ? submissionError.message : "Unable to create organization");
              }
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                {...register("name", { required: true, minLength: 2, maxLength: 120 })}
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" disabled={formState.isSubmitting} type="submit">
              {formState.isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
