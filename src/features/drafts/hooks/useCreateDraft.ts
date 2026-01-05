import { useMutation, useQueryClient } from "@tanstack/react-query";
import { draftsApi, DraftEntry, CreateDraftEntryRequest } from "@/src/api/drafts/drafts.api";

export const useCreateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation<DraftEntry, Error, CreateDraftEntryRequest>({
    mutationFn: (data) => draftsApi.createDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};
