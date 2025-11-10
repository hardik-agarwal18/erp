import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { requestExport, checkExportStatus } from "../service";

export function useExport() {
  const [jobId, setJobId] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: requestExport,
    onSuccess: (data) => {
      setJobId(data.jobId);
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ["exportStatus", jobId],
    queryFn: () => checkExportStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling if completed or failed
      const state = query.state.data?.status;
      if (state === "completed" || state === "failed") {
        return false;
      }
      return 2000;
    },
  });

  return {
    requestExport: exportMutation.mutateAsync,
    isRequesting: exportMutation.isPending,
    jobId,
    status: statusData?.status,
    url: statusData?.url,
    reset: () => setJobId(null),
  };
}
