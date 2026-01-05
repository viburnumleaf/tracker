import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersApi, CreateLogEntryRequest, LogEntry } from "@/src/api/trackers/trackers.api";

export const useCreateLogEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<LogEntry, Error, CreateLogEntryRequest>({
    mutationFn: (data) => trackersApi.createLogEntry(data),
    onSuccess: (_, variables) => {
      // Інвалідуємо записи логів
      queryClient.invalidateQueries({ queryKey: ["trackers", variables.trackerId, "entries"] });
      // Інвалідуємо трекери (щоб оновити схеми з новими enum значеннями)
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
};
