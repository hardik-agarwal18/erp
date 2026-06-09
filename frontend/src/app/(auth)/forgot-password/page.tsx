"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";

import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordFormValues>();

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setError("");
      setSuccess(false);
      // await apiClient.post("/auth/forgot-password", data);
      // For now simulate success:
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
      <div className="space-y-1 text-center lg:text-left">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Reset password</h2>
        <p className="text-sm text-slate-500 font-normal">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <div className="p-4 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-800 mb-1">Check your inbox</p>
              <p className="text-emerald-600">We&apos;ve sent a password reset link to your email. Please check your spam folder if you don&apos;t see it.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both space-y-4">
            {error ? (
              <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            ) : null}

            <Button 
              className="w-full h-11 text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-md hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 group/btn overflow-hidden relative" 
              disabled={formState.isSubmitting} 
              type="submit"
            >
              {/* Subtle shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              
              {formState.isSubmitting ? (
                <span className="flex items-center gap-2 relative z-10">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sending link...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  Send reset link
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
