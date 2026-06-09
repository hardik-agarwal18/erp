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

export default function ProfileSettingsPage() {
  const { session, restoreSession } = useWorkspace();
  const { updateProfile } = useProfileMutations();
  const { toast } = useToast();

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
      await updateProfile.mutateAsync(data);
      await restoreSession(); // Refresh context to get updated name/initials across the app
      
      reset(data); // Clear dirty state
      toast({
        title: "Profile updated",
        description: "Your personal details have been saved.",
        variant: "success",
      });

      if (data.email !== session.email) {
        toast({
          title: "Verification Required",
          description: "A verification link has been sent to your new email address.",
          variant: "warning",
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
    </AppShell>
  );
}
