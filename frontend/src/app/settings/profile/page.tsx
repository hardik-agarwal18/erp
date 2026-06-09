"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { UserCircle2, KeyRound, ShieldCheck, Mail, User, Camera } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { updateProfileSchema, type UpdateProfileSchema } from "@/features/profile/schema";
import { useProfileMutations } from "@/features/profile/hooks/use-profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";

export default function ProfileSettingsPage() {
  const { session, restoreSession } = useWorkspace();
  const { updateProfile, requestEmailChange, verifyEmailChange } = useProfileMutations();
  const { toast } = useToast();
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const { register, handleSubmit, reset, formState } = form;
  const { isDirty, errors } = formState;

  useEffect(() => {
    if (session) {
      reset({
        name: session.name || "",
        email: session.email || "",
      });
    }
  }, [session, reset]);

  const onSubmit = async (data: UpdateProfileSchema) => {
    try {
      if (data.email !== session?.email) {
        // Handle Email Change Flow
        await requestEmailChange.mutateAsync(data.email);
        setPendingEmail(data.email);
        setShowOtpModal(true);
        // Only update name right now
        if (data.name !== session?.name) {
          await updateProfile.mutateAsync({ name: data.name, email: session?.email || "" });
          await restoreSession();
        }
      } else {
        // Just updating name
        await updateProfile.mutateAsync(data);
        await restoreSession();
        reset(data);
        toast({
          title: "Profile updated",
          description: "Your personal details have been saved.",
          variant: "success",
        });
      }
    } catch (error: unknown) {
      let msg = "Failed to update profile.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (session) {
      reset({
        name: session.name || "",
        email: session.email || "",
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (currentEmailOtp.length !== 6 || newEmailOtp.length !== 6) {
      toast({ title: "Validation Error", description: "Please enter both 6-digit codes", variant: "destructive" });
      return;
    }
    try {
      await verifyEmailChange.mutateAsync({ currentEmailOtp, newEmailOtp });
      await restoreSession();
      toast({
        title: "Email updated",
        description: "Your email has been successfully verified and changed.",
        variant: "success",
      });
      setShowOtpModal(false);
      reset({ name: form.getValues("name"), email: pendingEmail });
      setCurrentEmailOtp("");
      setNewEmailOtp("");
    } catch (error: unknown) {
      let msg = "Failed to verify codes.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      toast({ title: "Verification failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <AppShell activePath="/settings/profile">
      <div className="space-y-8 max-w-4xl pb-10">
        <PageHeader
          title="My Profile"
          description="Manage your personal information, security preferences, and how you appear across the workspace."
          actions={<></>}
        />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Gradient Header */}
            <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
              <div className="absolute inset-0 bg-black/10" />
            </div>
            
            {/* Profile Avatar overlapping header */}
            <div className="px-6 relative -mt-12 flex justify-center">
              <div className="group relative h-24 w-24 rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-100 transition-transform duration-300 hover:scale-105">
                <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-2xl font-bold overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {session?.initials}
                </div>
                {/* Hover overlay for changing avatar */}
                <button className="absolute inset-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                  <Camera className="h-6 w-6" />
                </button>
              </div>
            </div>

            <CardContent className="pt-4 text-center pb-6">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{session?.name || "User"}</h3>
              <p className="text-sm text-slate-500 mb-4">{session?.email}</p>
              
              <div className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {session?.isVerified ? "Verified Account" : "Unverified"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="border-b border-slate-100/50 bg-slate-50/50 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-800">Personal Information</CardTitle>
                  <CardDescription>Update your contact details and how you are identified.</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="name"
                        className="pl-10 transition-shadow focus-visible:ring-indigo-500"
                        disabled={updateProfile.isPending}
                        aria-invalid={!!errors.name}
                        {...register("name")}
                      />
                    </div>
                    {errors.name && <p className="text-sm text-rose-500 font-medium">{errors.name.message}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        className="pl-10 transition-shadow focus-visible:ring-indigo-500"
                        disabled={updateProfile.isPending}
                        aria-invalid={!!errors.email}
                        {...register("email")}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">If you change your email, you will need to re-verify your account.</p>
                    {errors.email && <p className="text-sm text-rose-500 font-medium">{errors.email.message}</p>}
                  </div>
                </div>
              </CardContent>
              
              <div className="flex items-center justify-end gap-3 bg-slate-50/80 border-t border-slate-100 py-4 px-6 rounded-b-xl">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-slate-600 hover:text-slate-900"
                  disabled={!isDirty || updateProfile.isPending}
                >
                  Discard Changes
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  disabled={!isDirty || updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </Card>
          </form>

          {/* Security Settings Card */}
          <Card className="border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="border-b border-slate-100/50 bg-slate-50/50 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg text-slate-800">Security</CardTitle>
                <CardDescription>Manage your password and authentication settings.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Password</p>
                    <p className="text-sm text-slate-500 mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="shrink-0 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                  onClick={() => {
                    toast({
                      title: "Feature Unavailable",
                      description: "Password updates will be available in the next release.",
                    });
                  }}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      <Dialog open={showOtpModal} onOpenChange={(open) => !open && setShowOtpModal(false)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">Security Verification</DialogTitle>
                <DialogDescription className="text-blue-100 mt-1 text-sm">
                  Verify your email change request.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-600 text-center">
              We've sent verification codes to both your current email (<strong className="text-slate-900">{session?.email}</strong>) and your new email (<strong className="text-slate-900">{pendingEmail}</strong>).
            </p>
            
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-center">Current Email Code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={currentEmailOtp} onChange={(val) => setCurrentEmailOtp(val)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-2xl font-bold bg-white" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-2xl font-bold bg-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-center">New Email Code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={newEmailOtp} onChange={(val) => setNewEmailOtp(val)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-2xl font-bold bg-white" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-2xl font-bold bg-white" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-2xl font-bold bg-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 sm:justify-between flex-row">
            <Button variant="ghost" onClick={() => setShowOtpModal(false)} className="text-slate-500 hover:text-slate-700">Cancel</Button>
            <Button 
              onClick={handleVerifyOtp} 
              disabled={verifyEmailChange.isPending || currentEmailOtp.length !== 6 || newEmailOtp.length !== 6}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
            >
              {verifyEmailChange.isPending ? "Verifying..." : "Verify Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
