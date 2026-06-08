"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/services/auth.service";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordFormValues>();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Request a reset link from the live backend mail flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              try {
                setError(null);
                await forgotPassword(values.email);
                setMessage("If the account exists, a password reset email has been sent.");
              } catch (submissionError) {
                setError(submissionError instanceof Error ? submissionError.message : "Unable to request reset");
              }
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email", { required: true })} />
            </div>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" disabled={formState.isSubmitting} type="submit">
              {formState.isSubmitting ? "Submitting..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            <Link className="font-medium text-slate-950" href="/login">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
