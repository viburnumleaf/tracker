import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi } from "@/src/api/trackers/trackers.api";

export const usePermanentlyDeleteLogEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { trackerId: string; logEntryId: string }>({
    mutationFn: ({ trackerId, logEntryId }) =>
      trackersApi.permanentlyDeleteLogEntry(trackerId, logEntryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["trackers", variables.trackerId, "entries"],
      });
    },
  });
};
