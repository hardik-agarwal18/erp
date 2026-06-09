import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/services/auth.service";
import type { UpdateProfileSchema } from "../schema";

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileSchema) => updateProfile(data),
    onSuccess: () => {
      // Invalidate queries that might depend on the user's name/email
      // such as the session or any "me" queries if we had them in react-query
    },
  });

  return {
    updateProfile: updateProfileMutation,
  };
}
