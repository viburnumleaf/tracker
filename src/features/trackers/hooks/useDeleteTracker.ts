import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi } from "@/src/api/trackers/trackers.api";

export const useDeleteTracker = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (trackerId) => trackersApi.deleteTracker(trackerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
};
