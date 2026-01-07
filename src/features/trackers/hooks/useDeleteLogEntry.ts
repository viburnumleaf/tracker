import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi } from "@/src/api/trackers/trackers.api";

export const useDeleteLogEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { trackerId: string; logEntryId: string }>({
    mutationFn: ({ trackerId, logEntryId }) =>
      trackersApi.deleteLogEntry(trackerId, logEntryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["trackers", variables.trackerId, "entries"],
      });
      // Інвалідуємо останній лог, оскільки він може змінитися після видалення
      queryClient.invalidateQueries({
        queryKey: ["trackers", variables.trackerId, "last-entry"],
      });
    },
  });
};
