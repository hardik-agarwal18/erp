"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { apiClient } from "@/api/client";
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
      const res = await apiClient.post("/demo/seed");
      const data = res.data.data;
      await signIn({ email: data.email, password: data.password });
      router.replace(nextPath);
    } catch (submissionError: any) {
      setError(submissionError?.message || "Unable to generate demo");
      setIsDemoLoading(false);
    }
  };

  return (
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="text-sm text-slate-500">
            Enter your credentials to access your workspace.
          </p>
        </div>
        
        <form
          className="space-y-5"
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
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-slate-600 group-focus-within:text-indigo-600 transition-colors">Email</Label>
            <Input 
              id="email" 
              type="email" 
              className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              placeholder="name@example.com"
              {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" } })} 
            />
            {formState.errors.email && <p className="text-sm text-rose-500 font-medium">{formState.errors.email.message}</p>}
          </div>
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-600 group-focus-within:text-indigo-600 transition-colors">Password</Label>
              <Link className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })} 
            />
            {formState.errors.password && <p className="text-sm text-rose-500 font-medium">{formState.errors.password.message}</p>}
          </div>

          {error ? (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          ) : null}

          <Button 
            className="w-full h-12 text-base font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-[1px] transition-all duration-200" 
            disabled={formState.isSubmitting || isDemoLoading} 
            type="submit"
          >
            {formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">Or continue with</span>
          </div>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full h-12 text-base font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors" 
          onClick={handleDemoLogin} 
          disabled={isDemoLoading || formState.isSubmitting}
        >
          {isDemoLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Provisioning...
            </span>
          ) : "Try Interactive Demo"}
        </Button>

        <div className="text-center text-sm text-slate-600 mt-8">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex w-full">
      {/* Left Column: Visual/Brand Side */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 opacity-90 mix-blend-multiply"></div>
        
        {/* Decorative Blurred Orbs */}
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-pulse duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-[32rem] h-[32rem] bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[120px] opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-[0_0_40px_rgba(79,70,229,0.3)] transform transition hover:scale-105 duration-500">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
            Manage your entire <br/> business beautifully.
          </h1>
          <p className="text-lg text-indigo-100/80 max-w-md font-light leading-relaxed">
            The all-in-one platform designed to help modern teams collaborate, track financials, and scale effortlessly.
          </p>
        </div>
      </div>

      {/* Right Column: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <Suspense fallback={
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
            <div className="w-32 h-4 bg-slate-100 rounded"></div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
