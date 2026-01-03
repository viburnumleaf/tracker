import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi, UpdateTrackerRequest, Tracker } from "@/src/api/trackers/trackers.api";

export const useUpdateTracker = () => {
  const queryClient = useQueryClient();

  return useMutation<Tracker, Error, { trackerId: string; data: UpdateTrackerRequest }>({
    mutationFn: ({ trackerId, data }) => trackersApi.updateTracker(trackerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
};
