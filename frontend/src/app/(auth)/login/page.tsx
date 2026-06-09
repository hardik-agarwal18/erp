"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <div className="space-y-1 text-center lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 font-normal">
            Enter your credentials to continue.
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
          <div className="space-y-2 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
            <Label htmlFor="email" className="text-slate-700 font-medium transition-colors">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <Input 
                id="email" 
                type="email" 
                className="h-11 pl-10 bg-white border-slate-200 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg transition-all duration-300"
                placeholder="name@example.com"
                {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" } })} 
              />
            </div>
            {formState.errors.email && <p className="text-sm text-rose-500 font-medium animate-in fade-in">{formState.errors.email.message}</p>}
          </div>
          
          <div className="space-y-2 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700 font-medium transition-colors">Password</Label>
              <Link className="text-sm font-medium text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline transition-all" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                className="h-11 pl-10 pr-10 bg-white border-slate-200 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg transition-all duration-300"
                placeholder="••••••••"
                {...register("password", { required: "Password is required" })} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formState.errors.password && <p className="text-sm text-rose-500 font-medium animate-in fade-in">{formState.errors.password.message}</p>}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:450ms] fill-mode-both space-y-4">
            {error ? (
            <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          ) : null}

            <Button 
              className="w-full h-11 text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-md hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 group/btn overflow-hidden relative" 
              disabled={formState.isSubmitting || isDemoLoading} 
              type="submit"
            >
              {/* Subtle shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              
              {formState.isSubmitting ? (
                <span className="flex items-center gap-2 relative z-10">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider animate-in fade-in duration-1000 [animation-delay:600ms] fill-mode-both">
            <span className="bg-white px-4 text-slate-400 font-medium">Or</span>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:750ms] fill-mode-both space-y-8">
          <Button 
            type="button"
            variant="outline"
            className="w-full h-11 text-sm font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm rounded-lg transition-all duration-200 group/demo hover:border-violet-200" 
            onClick={handleDemoLogin} 
            disabled={isDemoLoading || formState.isSubmitting}
          >
            {isDemoLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading Demo...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Try Interactive Demo
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/demo:opacity-100 group-hover/demo:translate-x-0 transition-all text-violet-600" />
              </span>
            )}
          </Button>

          <div className="text-center text-sm text-slate-500 font-normal">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline transition-colors" href="/signup">
              Sign up
            </Link>
          </div>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse flex flex-col items-center justify-center space-y-4 w-full h-full min-h-[50vh]">
        <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
        <div className="w-32 h-4 bg-slate-100 rounded"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
