import { useState, useCallback } from "react";

type UseDialogOptions = {
  onOpenChange?: (open: boolean) => void;
  resetOnClose?: boolean;
}

type UseDialogReturn = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleOpen: () => void;
  handleClose: () => void;
  handleOpenChange: (open: boolean) => void;
}

export const useDialog = ({
  onOpenChange,
  resetOnClose = false,
}: UseDialogOptions = {}): UseDialogReturn => {
  const [open, setOpenState] = useState(false);

  const setOpen = useCallback(
    (newOpen: boolean) => {
      setOpenState(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (resetOnClose && !newOpen) {
        // Reset logic can be added here if needed
      }
    },
    [setOpen, resetOnClose]
  );

  return {
    open,
    setOpen,
    handleOpen,
    handleClose,
    handleOpenChange,
  };
}
