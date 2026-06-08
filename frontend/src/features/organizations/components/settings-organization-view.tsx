"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { updateOrganizationSchema, type UpdateOrganizationSchema } from "../schema";
import { useOrganization, useOrganizationMutations } from "../hooks/use-organizations";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";

export function SettingsOrganizationView() {
  const { hasRole } = useWorkspace();
  const { hasPermission } = usePermissions();
  const { data: organization, isLoading, isError } = useOrganization();
  const { updateOrganization } = useOrganizationMutations();
  const { toast } = useToast();

  const canEdit = hasPermission("organization.update");
  const isOwner = hasRole("owner");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    try {
      setTimezones(Intl.supportedValuesOf("timeZone"));
    } catch {
      setTimezones(["UTC", "America/New_York", "Europe/London"]); // fallback
    }
  }, []);

  const form = useForm<UpdateOrganizationSchema>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: "",
      legalName: "",
      currency: "INR",
      timezone: "UTC",
      description: "",
    },
  });

  const { register, handleSubmit, reset, formState, setValue, watch } = form;
  const { isDirty, errors } = formState;

  // Populate form when data loads
  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name || "",
        legalName: (organization.settings?.legalName as string) || "",
        currency: (organization.settings?.currency as string) || "INR",
        timezone: (organization.settings?.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        description: (organization.settings?.description as string) || "",
      });
    }
  }, [organization, reset]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: UpdateOrganizationSchema) => {
    try {
      await updateOrganization.mutateAsync(data);
      reset(data); // Clear dirty state
      toast({
        title: "Organization updated",
        description: "Your organization profile has been successfully updated.",
        variant: "success",
      });
    } catch (error: unknown) {
      let msg = "Failed to update organization profile.";
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
    if (organization) {
      reset({
        name: organization.name || "",
        legalName: (organization.settings?.legalName as string) || "",
        currency: (organization.settings?.currency as string) || "INR",
        timezone: (organization.settings?.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        description: (organization.settings?.description as string) || "",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading organization details...</div>;
  }

  if (isError || !organization) {
    return <div className="p-8 text-center text-rose-500">Failed to load organization details.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Organization Details"
        description="Manage your business profile and workspace settings."
      />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Profile Info</CardTitle>
              <CardDescription>Update your company name and basic information.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                disabled={!canEdit || updateOrganization.isPending}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-rose-500 font-medium">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                disabled={!canEdit || updateOrganization.isPending}
                aria-invalid={!!errors.legalName}
                {...register("legalName")}
              />
              <p className="text-xs text-slate-500">Optional. The official registered entity name.</p>
              {errors.legalName && <p className="text-sm text-rose-500 font-medium">{errors.legalName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Base Currency (ISO 3-Letter)</Label>
                <Input
                  id="currency"
                  disabled={!canEdit || updateOrganization.isPending}
                  aria-invalid={!!errors.currency}
                  {...register("currency", {
                    onChange: (e) => {
                      setValue("currency", e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true });
                    }
                  })}
                  placeholder="e.g. USD, EUR"
                />
                {errors.currency && <p className="text-sm text-rose-500 font-medium">{errors.currency.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  disabled={!canEdit || updateOrganization.isPending}
                  aria-invalid={!!errors.timezone}
                  value={watch("timezone")}
                  onChange={(e) => setValue("timezone", e.target.value, { shouldDirty: true, shouldValidate: true })}
                >
                  <option value="" disabled>Select a timezone...</option>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </Select>
                {errors.timezone && <p className="text-sm text-rose-500 font-medium">{errors.timezone.message}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                disabled={!canEdit || updateOrganization.isPending}
                aria-invalid={!!errors.description}
                {...register("description")}
                placeholder="Brief description of your organization..."
              />
              {errors.description && <p className="text-sm text-rose-500 font-medium">{errors.description.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="h-20 px-3 py-2 border border-dashed rounded-md bg-slate-50 text-sm text-slate-500 border-slate-200 flex items-center justify-center">
                Logo Upload Coming Soon
              </div>
            </div>
          </CardContent>
          
          {canEdit && (
            <div className="flex justify-end gap-2 bg-slate-50 border-t border-slate-100 py-4 px-4 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={!isDirty || updateOrganization.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || updateOrganization.isPending}
              >
                {updateOrganization.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </Card>
      </form>

      {isOwner && (
        <>
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-800">Delete Organization</p>
                <p className="text-xs text-rose-600/80">Permanently remove this workspace and all its data.</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="border-rose-200 text-rose-700 hover:bg-rose-100"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
          <DeleteOrganizationDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
    </div>
  );
}
