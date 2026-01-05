import { useMutation, useQueryClient } from "@tanstack/react-query";
import { draftsApi, DraftEntry, UpdateDraftEntryRequest } from "@/src/api/drafts/drafts.api";

export const useUpdateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation<
    DraftEntry,
    Error,
    { draftId: string; data: UpdateDraftEntryRequest }
  >({
    mutationFn: ({ draftId, data }) => draftsApi.updateDraft(draftId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};
