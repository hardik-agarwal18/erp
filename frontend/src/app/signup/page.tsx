"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/services/auth.service";

type SignupFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<SignupFormValues>();

  return (
    <main className="min-h-screen flex w-full">
      {/* Left Column: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h2>
            <p className="text-sm text-slate-500">
              Enter your details to create a new workspace.
            </p>
          </div>
          
          <form
            className="space-y-5"
            onSubmit={handleSubmit(async (values) => {
              try {
                setError(null);
                setMessage(null);
                await signup(values);
                reset();
                setMessage("Signup successful. Check your email to verify the account.");
              } catch (submissionError) {
                setError(submissionError instanceof Error ? submissionError.message : "Unable to create account");
              }
            })}
          >
            <div className="space-y-2 group">
              <Label htmlFor="name" className="text-slate-600 group-focus-within:text-indigo-600 transition-colors">Name</Label>
              <Input 
                id="name" 
                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
                placeholder="Jane Doe"
                {...register("name", { required: "Name is required" })} 
              />
              {formState.errors.name && <p className="text-sm text-rose-500 font-medium">{formState.errors.name.message}</p>}
            </div>

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
              <Label htmlFor="password" className="text-slate-600 group-focus-within:text-indigo-600 transition-colors">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
                placeholder="••••••••"
                {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} 
              />
              {formState.errors.password && <p className="text-sm text-rose-500 font-medium">{formState.errors.password.message}</p>}
            </div>

            {message ? (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            ) : null}

            <Button 
              className="w-full h-12 text-base font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-[1px] transition-all duration-200" 
              disabled={formState.isSubmitting} 
              type="submit"
            >
              {formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating account...
                </span>
              ) : "Create account"}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600 mt-8">
            Already have an account?{" "}
            <Link className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Visual/Brand Side */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600 via-indigo-700 to-slate-900 opacity-90 mix-blend-multiply"></div>
        
        {/* Decorative Blurred Orbs */}
        <div className="absolute top-1/4 -right-1/4 w-[32rem] h-[32rem] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-0 -left-1/4 w-[32rem] h-[32rem] bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-[pulse_8s_ease-in-out_infinite]"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-[0_0_40px_rgba(217,70,239,0.3)] transform transition hover:scale-105 duration-500">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
            Join thousands of <br/> forward-thinking teams.
          </h1>
          <p className="text-lg text-indigo-100/80 max-w-md font-light leading-relaxed">
            Get started today and experience the future of enterprise resource planning.
          </p>
        </div>
      </div>
    </main>
  );
}
