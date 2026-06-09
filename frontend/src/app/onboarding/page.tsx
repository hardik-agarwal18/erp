"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { CheckCircle2, Building2, UserPlus, ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/hooks/use-workspace";
import { createOrganization, createJoinRequest } from "@/services/organization.service";
import { PageLoader } from "@/components/states/page-loader";

type CreateWorkspaceFormValues = {
  name: string;
  invites: { email: string }[];
};

type JoinWorkspaceFormValues = {
  joinCode: string;
  message: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { restoreSession, workspaces, isAuthenticated, isLoading } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"choice" | "create" | "join" | "pending">("choice");
  
  const createForm = useForm<CreateWorkspaceFormValues>({
    defaultValues: { name: "", invites: [] }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: "invites",
  });

  const joinForm = useForm<JoinWorkspaceFormValues>({
    defaultValues: { joinCode: "", message: "" }
  });

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

  const onCreateSubmit = async (values: CreateWorkspaceFormValues) => {
    try {
      setError(null);
      const emails = values.invites.map(i => i.email).filter(Boolean);
      await createOrganization({ name: values.name, invites: emails });
      await restoreSession(); // This will refresh the user's workspaces and active organization
      router.push("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create organization");
    }
  };

  const onJoinSubmit = async (values: JoinWorkspaceFormValues) => {
    try {
      setError(null);
      await createJoinRequest(values);
      setMode("pending");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to request to join organization");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8">
      <div className="w-full max-w-2xl">
        
        {mode === "choice" && (
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Welcome to your ERP!</h1>
            <p className="text-lg text-slate-600">How would you like to get started?</p>
            
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <Card 
                className="group cursor-pointer border-slate-200 transition-all hover:border-indigo-500 hover:shadow-md"
                onClick={() => setMode("create")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-indigo-50 p-4 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Create Workspace</h3>
                  <p className="text-sm text-slate-500">
                    Start a new organization and invite your team members.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer border-slate-200 transition-all hover:emerald-500 hover:shadow-md"
                onClick={() => setMode("join")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-emerald-50 p-4 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Join Workspace</h3>
                  <p className="text-sm text-slate-500">
                    Enter a Join Code or Organization ID to request access to an existing organization.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {mode === "create" && (
          <Card className="border-slate-200 shadow-xl mx-auto max-w-lg">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-4 mb-2 text-slate-500" onClick={() => { setError(null); setMode("choice"); }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle>Create Workspace</CardTitle>
              <CardDescription>Setup your organization profile to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={createForm.handleSubmit(onCreateSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name <span className="text-rose-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Acme Corp"
                    {...createForm.register("name", { required: true, minLength: 2, maxLength: 120 })}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Invite Team Members (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ email: "" })}>
                      Add Member
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="colleague@example.com"
                        {...createForm.register(`invites.${index}.email` as const, { required: true })}
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-rose-500 shrink-0" onClick={() => remove(index)}>
                        X
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No members added yet. You can invite them later.</p>
                  )}
                </div>

                {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                
                <Button className="w-full" disabled={createForm.formState.isSubmitting} type="submit">
                  {createForm.formState.isSubmitting ? "Creating Workspace..." : "Create Workspace"}
                  {!createForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {mode === "join" && (
          <Card className="border-slate-200 shadow-xl mx-auto max-w-lg">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-4 mb-2 text-slate-500" onClick={() => { setError(null); setMode("choice"); }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle>Join Workspace</CardTitle>
              <CardDescription>Enter the Join Code or Organization ID provided by your administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={joinForm.handleSubmit(onJoinSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Join Code or Organization ID <span className="text-rose-500">*</span></Label>
                  <Input
                    id="joinCode"
                    className="font-mono uppercase tracking-widest text-lg"
                    placeholder="ACME-XXXXXX or UUID"
                    {...joinForm.register("joinCode", { required: true })}
                  />
                  <p className="text-xs text-slate-500">Ask your workspace administrator for this code or ID.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Hi, I recently joined the Finance department..."
                    className="resize-none"
                    rows={3}
                    {...joinForm.register("message")}
                  />
                </div>

                {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                
                <Button className="w-full" disabled={joinForm.formState.isSubmitting} type="submit">
                  {joinForm.formState.isSubmitting ? "Sending Request..." : "Request Access"}
                  {!joinForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {mode === "pending" && (
          <Card className="border-emerald-200 shadow-xl mx-auto max-w-lg text-center overflow-hidden">
            <div className="bg-emerald-50 py-10 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Request Sent Successfully</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                Your request to join the workspace has been sent to the administrators. You will be notified by email once your request is approved.
              </p>
              <Button className="w-full" variant="outline" onClick={() => router.push("/login")}>
                Return to Login
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}
