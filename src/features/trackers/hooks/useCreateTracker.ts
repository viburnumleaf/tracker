import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi, CreateTrackerRequest, Tracker } from "@/src/api/trackers/trackers.api";

export const useCreateTracker = () => {
  const queryClient = useQueryClient();

  return useMutation<Tracker, Error, CreateTrackerRequest>({
    mutationFn: (data) => trackersApi.createTracker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
};
