import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, requestEmailChange, verifyEmailChange } from "@/services/auth.service";
import type { UpdateProfileSchema } from "../schema";

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileSchema) => updateProfile(data),
    onSuccess: () => {},
  });

  const requestEmailChangeMutation = useMutation({
    mutationFn: (newEmail: string) => requestEmailChange(newEmail),
  });

  const verifyEmailChangeMutation = useMutation({
    mutationFn: (data: { currentEmailOtp: string; newEmailOtp: string }) => verifyEmailChange(data),
  });

  return {
    updateProfile: updateProfileMutation,
    requestEmailChange: requestEmailChangeMutation,
    verifyEmailChange: verifyEmailChangeMutation,
  };
}
