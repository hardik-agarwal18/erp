"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmail } from "@/services/auth.service";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"pending" | "success" | "error">(token ? "pending" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email..." : "Verification token missing from the URL.");

  useEffect(() => {
    if (!token) {
      return;
    }

    void verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully. You can sign in now.");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to verify email");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Connected directly to the backend verification flow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={status === "error" ? "text-sm text-rose-600" : "text-sm text-slate-600"}>{message}</p>
        <Button asChild className="w-full">
          <Link href="/login">{status === "success" ? "Continue to sign in" : "Back to sign in"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4">
      <Suspense fallback={<div>Loading verification...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
