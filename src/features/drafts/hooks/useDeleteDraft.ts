import { useMutation, useQueryClient } from "@tanstack/react-query";
import { draftsApi } from "@/src/api/drafts/drafts.api";

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (draftId) => draftsApi.deleteDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};
