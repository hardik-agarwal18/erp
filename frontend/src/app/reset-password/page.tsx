"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/auth.service";

type ResetPasswordFormValues = {
  password: string;
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ResetPasswordFormValues>();

  return (
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Submit the token issued by the backend password reset flow.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-rose-600">Reset token missing from the URL.</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit(async (values) => {
                try {
                  setError(null);
                  await resetPassword({ token, password: values.password });
                  setMessage("Password updated successfully. You can sign in now.");
                } catch (submissionError) {
                  setError(submissionError instanceof Error ? submissionError.message : "Unable to reset password");
                }
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" {...register("password", { required: true, minLength: 8 })} />
              </div>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button className="w-full" disabled={formState.isSubmitting} type="submit">
                {formState.isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-sm text-slate-600">
            <Link className="font-medium text-slate-950" href="/login">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <Suspense fallback={<div>Loading form...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
