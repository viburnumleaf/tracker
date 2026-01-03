import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi } from "@/src/api/trackers/trackers.api";

export const usePermanentlyDeleteTracker = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (trackerId) => trackersApi.permanentlyDeleteTracker(trackerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
};
