"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { Building2, ArrowRight, ArrowLeft, Loader2, UserPlus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvitation, type AcceptInvitationPayload } from "@/services/invitation.service";

type SetupFormValues = {
  name: string;
  password: string;
};

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<"processing" | "setup" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SetupFormValues>({
    defaultValues: { name: "", password: "" },
  });

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("No invitation token provided. Please check your email link.");
      return;
    }

    const processToken = async () => {
      try {
        // Attempt to accept immediately (works if user already exists)
        await acceptInvitation({ token });
        setState("success");
      } catch (error) {
        if (isAxiosError(error)) {
          const msg = error.response?.data?.message || "";
          if (msg.includes("Name and password are required")) {
            // User doesn't exist, they need to provide a name and password
            setState("setup");
          } else {
            setState("error");
            setErrorMessage(msg || "Unable to process invitation.");
          }
        } else {
          setState("error");
          setErrorMessage("An unexpected error occurred.");
        }
      }
    };

    processToken();
  }, [token]);

  const onSubmit = async (values: SetupFormValues) => {
    if (!token) return;
    try {
      await acceptInvitation({
        token,
        name: values.name,
        password: values.password,
      });
      setState("success");
    } catch (error) {
      if (isAxiosError(error)) {
        form.setError("root", {
          message: error.response?.data?.message || "Failed to accept invitation.",
        });
      } else {
        form.setError("root", { message: "An unexpected error occurred." });
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 sm:p-8">
      <div className="w-full max-w-md">
        
        {state === "processing" && (
          <Card className="border-slate-200 shadow-xl overflow-hidden border-t-4 border-t-indigo-600">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Processing Invitation</h2>
                <p className="text-slate-500 text-sm">Please wait while we verify your link...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "error" && (
          <Card className="border-rose-200 shadow-xl overflow-hidden border-t-4 border-t-rose-500">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-rose-600">Invalid Link</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-6">
              <p className="text-slate-600">
                {errorMessage || "This invitation link is invalid or has expired."}
              </p>
              <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "setup" && (
          <Card className="border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Complete Setup</h1>
              <p className="text-blue-100 text-sm mt-1">Set up your account to accept this invitation.</p>
            </div>
            
            <CardContent className="p-6">
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-rose-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    disabled={form.formState.isSubmitting}
                    {...form.register("name", { required: "Name is required", minLength: 2 })}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Create Password <span className="text-rose-500">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={form.formState.isSubmitting}
                    {...form.register("password", { required: "Password is required", minLength: 8 })}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-rose-500">{form.formState.errors.password.message}</p>
                  )}
                  <p className="text-xs text-slate-500">Must be at least 8 characters long.</p>
                </div>

                {form.formState.errors.root && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-600 font-medium">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2" disabled={form.formState.isSubmitting} type="submit">
                  {form.formState.isSubmitting ? "Accepting..." : "Join Workspace"}
                  {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {state === "success" && (
          <Card className="border-emerald-200 shadow-xl overflow-hidden border-t-4 border-t-emerald-500 text-center">
            <CardContent className="p-8 space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitation Accepted!</h2>
                <p className="text-slate-500">
                  You have successfully joined the workspace. Please log in to continue.
                </p>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/login")}>
                Go to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 shadow-xl overflow-hidden border-t-4 border-t-indigo-600">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Loading...</h2>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
